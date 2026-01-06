/**
 * WebSocket Client for Aliyun CosyVoice TTS Service
 * 封装 CosyVoice WebSocket API 交互逻辑
 */

import WebSocket from 'ws';
import { randomUUID } from 'crypto';

/**
 * TTS 请求参数
 */
export interface TTSRequestParams {
	/** 待合成文本 */
	text: string;
	/** 模型名称 */
	model: string;
	/** 音色 */
	voice: string;
	/** 音频格式 */
	format?: 'mp3' | 'wav' | 'pcm' | 'opus';
	/** 采样率 */
	sampleRate?: number;
	/** 音量 0-100 */
	volume?: number;
	/** 语速 0.5-2.0 */
	rate?: number;
	/** 音调 0.5-2.0 */
	pitch?: number;
	/** 是否开启 SSML */
	enableSSML?: boolean;
	/** 情感/场景指令 */
	instruction?: string;
	/** 字级别时间戳 */
	wordTimestampEnabled?: boolean;
	/** 随机种子 */
	seed?: number;
	/** 语言提示 */
	languageHints?: string[];
	/** Opus 码率 */
	bitRate?: number;
	/** 超时时间（毫秒），默认 180000（3 分钟） */
	timeoutMs?: number;
}

/**
 * TTS 响应结果
 */
export interface TTSResponse {
	/** 音频数据 */
	audio: Buffer;
	/** Request ID */
	requestId?: string;
	/** 字符数（计费用） */
	characters?: number;
	/** 字级别时间戳（如果启用） */
	words?: Array<{
		text: string;
		beginTime: number;
		endTime: number;
	}>;
}

/**
 * WebSocket 事件类型
 */
type WSEvent = 'task-started' | 'result-generated' | 'task-finished' | 'task-failed';

/**
 * WebSocket 事件消息
 */
interface WSEventMessage {
	header: {
		event: WSEvent;
		task_id: string;
		error_code?: string;
		error_message?: string;
		attributes?: {
			request_uuid?: string;
		};
	};
	payload: {
		usage?: {
			characters: number;
		};
		output?: {
			sentence?: {
				words?: Array<{
					text: string;
					begin_time: number;
					end_time: number;
				}>;
			};
		};
	};
}

/**
 * 调用 CosyVoice WebSocket API 进行语音合成
 *
 * @param params TTS 参数
 * @param apiKey Aliyun DashScope API Key
 * @returns Promise<TTSResponse>
 */
export async function synthesizeSpeech(
	params: TTSRequestParams,
	apiKey: string,
): Promise<TTSResponse> {
	return new Promise((resolve, reject) => {
		// 生成任务 ID
		const taskId = randomUUID();

		// 音频数据收集器
		const audioChunks: Buffer[] = [];
		let requestUuid: string | undefined;
		let characters: number | undefined;
		let words: TTSResponse['words'];

		// WebSocket URL
		const wsUrl = 'wss://dashscope.aliyuncs.com/api-ws/v1/inference';

		// 创建 WebSocket 连接
		const ws = new WebSocket(wsUrl, {
			headers: {
				Authorization: `bearer ${apiKey}`,
				'X-DashScope-DataInspection': 'enable',
			},
		});

		// 超时控制（默认 3 分钟）
		const timeoutMs = params.timeoutMs ?? 180000;
		const timeout = setTimeout(() => {
			ws.close();
			reject(new Error(`WebSocket connection timeout after ${timeoutMs / 1000} seconds`));
		}, timeoutMs);

		// 错误标记，避免重复 reject
		let hasError = false;
		// 是否已经 settled（无论 resolve 还是 reject）
		let isSettled = false;

		// 错误处理
		ws.on('error', (error) => {
			clearTimeout(timeout);
			hasError = true;
			if (!isSettled) {
				isSettled = true;
				reject(new Error(`WebSocket error: ${error.message}`));
			}
		});

		// 接收消息
		ws.on('message', (data: Buffer, isBinary: boolean) => {
			if (isBinary) {
				// 二进制音频数据
				audioChunks.push(Buffer.from(data));
			} else {
				// JSON 事件消息
				try {
					const message: WSEventMessage = JSON.parse(data.toString());

					switch (message.header.event) {
						case 'task-started':
							// 任务已启动，发送文本
							sendContinueTask(ws, taskId, params.text);
							// 发送完文本后立即发送 finish-task
							sendFinishTask(ws, taskId);
							break;

						case 'result-generated':
							// 记录 Request ID
							requestUuid = message.header.attributes?.request_uuid;
							// 记录字符数（如果存在）
							if (message.payload.usage?.characters) {
								characters = message.payload.usage.characters;
							}
							break;

						case 'task-finished':
							// 任务完成
							if (message.payload.output?.sentence?.words) {
								words = message.payload.output.sentence.words.map((w) => ({
									text: w.text,
									beginTime: w.begin_time,
									endTime: w.end_time,
								}));
							}
							// 获取最终的字符数
							if (message.payload.usage?.characters) {
								characters = message.payload.usage.characters;
							}
							ws.close();
							break;

						case 'task-failed':
							// 任务失败
							hasError = true;
							ws.close();
							if (!isSettled) {
								isSettled = true;
								reject(
									new Error(
										`Task failed: ${message.header.error_message || 'Unknown error'} (code: ${message.header.error_code})`,
									),
								);
							}
							break;
					}
				} catch {
					// JSON 解析失败，忽略
				}
			}
		});

		// 连接建立后发送 run-task
		ws.on('open', () => {
			sendRunTask(ws, taskId, params);
		});

		// 连接关闭时返回结果
		ws.on('close', () => {
			clearTimeout(timeout);

			// 如果已经 settled（比如在 task-failed 中 reject 了），不再处理
			if (isSettled) {
				return;
			}

			isSettled = true;

			// 如果没有错误，返回结果（即使音频为空）
			if (!hasError) {
				if (audioChunks.length === 0) {
					// 没有收到任何音频数据，这是异常情况
					reject(new Error('No audio data received from CosyVoice API'));
				} else {
					resolve({
						audio: Buffer.concat(audioChunks),
						requestId: requestUuid,
						characters,
						words,
					});
				}
			}
		});
	});
}

/**
 * 发送 run-task 指令
 */
function sendRunTask(ws: WebSocket, taskId: string, params: TTSRequestParams): void {
	const runTaskCommand = {
		header: {
			action: 'run-task',
			task_id: taskId,
			streaming: 'duplex',
		},
		payload: {
			task_group: 'audio',
			task: 'tts',
			function: 'SpeechSynthesizer',
			model: params.model,
			parameters: {
				text_type: 'PlainText',
				voice: params.voice,
				format: params.format || 'mp3',
				sample_rate: params.sampleRate || 22050,
				volume: params.volume ?? 50,
				rate: params.rate ?? 1.0,
				pitch: params.pitch ?? 1.0,
				...(params.enableSSML && { enable_ssml: true }),
				...(params.instruction && { instruction: params.instruction }),
				...(params.wordTimestampEnabled && { word_timestamp_enabled: true }),
				...(params.seed && params.seed > 0 && { seed: params.seed }),
				...(params.languageHints && { language_hints: params.languageHints }),
				...(params.bitRate && { bit_rate: params.bitRate }),
			},
			input: {},
		},
	};

	ws.send(JSON.stringify(runTaskCommand));
}

/**
 * 发送 continue-task 指令
 */
function sendContinueTask(ws: WebSocket, taskId: string, text: string): void {
	const continueTaskCommand = {
		header: {
			action: 'continue-task',
			task_id: taskId,
			streaming: 'duplex',
		},
		payload: {
			input: {
				text,
			},
		},
	};

	ws.send(JSON.stringify(continueTaskCommand));
}

/**
 * 发送 finish-task 指令
 */
function sendFinishTask(ws: WebSocket, taskId: string): void {
	const finishTaskCommand = {
		header: {
			action: 'finish-task',
			task_id: taskId,
			streaming: 'duplex',
		},
		payload: {
			input: {},
		},
	};

	ws.send(JSON.stringify(finishTaskCommand));
}
