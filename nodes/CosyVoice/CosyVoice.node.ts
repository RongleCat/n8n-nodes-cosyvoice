/**
 * Aliyun CosyVoice Node for n8n
 * 文字转语音节点 - 编程式风格
 */

import {
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeProperties,
	type INodeType,
	type INodeTypeDescription,
	type INodeListSearchResult,
	type ILoadOptionsFunctions,
	NodeOperationError,
} from 'n8n-workflow';
import { synthesizeSpeech } from './utils/websocket';
import { getVoiceInfo } from './utils/voiceList';

export const cosyVoiceDescription: INodeProperties[] = [
	{
		displayName: 'Text',
		name: 'text',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		required: true,
		description: '待合成的文本内容',
	},
	{
		displayName: 'Model',
		name: 'model',
		type: 'options',
		options: [
			{ name: 'CosyVoice V3 Flash (推荐)', value: 'cosyvoice-v3-flash' },
			{ name: 'CosyVoice V3 Plus', value: 'cosyvoice-v3-plus' },
			{ name: 'CosyVoice V2', value: 'cosyvoice-v2' },
			{ name: 'CosyVoice V1', value: 'cosyvoice-v1' },
		],
		default: 'cosyvoice-v3-flash',
		required: true,
		description: '选择 CosyVoice 模型版本',
	},
	{
		displayName: 'Voice',
		name: 'voice',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		description: '选择音色或手动输入音色 ID',
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'searchVoices',
					searchable: true,
					searchFilterRequired: false,
				},
				placeholder: 'Select a voice...',
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. longxiaochun',
				hint: '输入音色 ID，例如 longxiaochun',
			},
		],
	},
	{
		displayName: 'Enable SSML',
		name: 'enable_ssml',
		type: 'boolean',
		default: false,
		description: 'Whether to enable SSML mode. When enabled, the text field should contain SSML formatted text.',
	},
	{
		displayName: 'Additional Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		options: [
			{
				displayName: 'Audio Format',
				name: 'format',
				type: 'options',
				options: [
					{ name: 'MP3', value: 'mp3' },
					{ name: 'WAV', value: 'wav' },
					{ name: 'PCM', value: 'pcm' },
					{ name: 'OPUS', value: 'opus' },
				],
				default: 'wav',
			},
			{
				displayName: 'Binary Field Name',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				description: 'The field name for the output binary data',
			},
			{
				displayName: 'File Name',
				name: 'fileName',
				type: 'string',
				default: '',
				placeholder: 'e.g. my_audio.mp3',
				description: 'The name of the output file (including extension). Leave empty to auto-generate.',
			},
			{
				displayName: 'Instruction',
				name: 'instruction',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Pitch',
				name: 'pitch',
				type: 'number',
				typeOptions: { minValue: 0.5, maxValue: 2.0, step: 0.1, numberPrecision: 1 },
				default: 1,
			},
			{
				displayName: 'Sample Rate',
				name: 'sampleRate',
				type: 'options',
				options: [
					{ name: '8000 Hz', value: 8000 },
					{ name: '16000 Hz', value: 16000 },
					{ name: '22050 Hz', value: 22050 },
					{ name: '24000 Hz', value: 24000 },
					{ name: '44100 Hz', value: 44100 },
					{ name: '48000 Hz', value: 48000 },
				],
				default: 22050,
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'number',
				typeOptions: { minValue: 0, maxValue: 65535 },
				default: 0,
			},
			{
				displayName: 'Speed Rate',
				name: 'rate',
				type: 'number',
				typeOptions: { minValue: 0.5, maxValue: 2.0, step: 0.01, numberPrecision: 2 },
				default: 1,
			},
			{
				displayName: 'Volume',
				name: 'volume',
				type: 'number',
				typeOptions: { minValue: 0, maxValue: 100 },
				default: 50,
			},
			{
				displayName: 'WebSocket Timeout (seconds)',
				name: 'timeout',
				type: 'number',
				typeOptions: { minValue: 30, maxValue: 600 },
				default: 180,
				description: 'WebSocket connection timeout in seconds. Increase for long text.',
			},
			{
				displayName: 'Word Timestamp',
				name: 'wordTimestampEnabled',
				type: 'boolean',
				default: false,
			},
		],
	},
];

export class CosyVoice implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'CosyVoice',
		name: 'cosyVoice',
		icon: 'file:../../icons/cosyvoice.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter.model + " - " + $parameter.voice}}',
		description: '使用阿里云百炼 CosyVoice 服务将文字转换为语音',
		defaults: {
			name: 'CosyVoice',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'cosyVoiceApi',
				required: true,
			},
		],
		properties: cosyVoiceDescription,
		usableAsTool: true,
	};

	methods = {
		listSearch: {
			/**
			 * 搜索音色列表（支持 resourceLocator 的 list 模式）
			 */
			async searchVoices(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult> {
				try {
					const model = this.getNodeParameter('model') as string;
					const { getVoicesByModel } = await import('./utils/voiceList');
					let voices = getVoicesByModel(model);

					// 如果有过滤条件，进行过滤
					if (filter) {
						const lowerFilter = filter.toLowerCase();
						voices = voices.filter(
							(v) =>
								v.name.toLowerCase().includes(lowerFilter) ||
								v.voice.toLowerCase().includes(lowerFilter) ||
								v.description.toLowerCase().includes(lowerFilter),
						);
					}

					this.logger.debug(`[CosyVoice] 搜索音色列表 - 模型: ${model}, 过滤: ${filter || '无'}, 结果数量: ${voices.length}`);

					return {
						results: voices.map((v) => ({
							name: `${v.name} - ${v.description}`,
							value: v.voice,
						})),
					};
				} catch (error) {
					this.logger.error(`[CosyVoice] 搜索音色列表失败: ${error}`);
					return { results: [] };
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// 添加执行开始日志
		this.logger.debug(`[CosyVoice] 开始执行 - 输入项数量: ${items.length}`);

		for (let i = 0; i < items.length; i++) {
			try {
				// 添加当前item日志
				this.logger.debug(`[CosyVoice] 处理项 ${i + 1}/${items.length}`);

				// 获取凭证
				const credentials = await this.getCredentials('cosyVoiceApi');
				const apiKey = credentials.apiKey as string;

				if (!apiKey) {
					throw new NodeOperationError(this.getNode(), 'API Key is required. Please configure your credentials.');
				}

				// 获取参数
				const text = this.getNodeParameter('text', i, '') as string;
				const model = this.getNodeParameter('model', i, 'cosyvoice-v3-flash') as string;
				const voiceParam = this.getNodeParameter('voice', i) as { mode: string; value: string } | string;
				const voice = typeof voiceParam === 'string' ? voiceParam : voiceParam.value;
				const enableSSML = this.getNodeParameter('enable_ssml', i, false) as boolean;

				this.logger.debug(`[CosyVoice] 参数获取成功 - 文本长度: ${text.length}, 模型: ${model}, 音色: ${voice}, SSML: ${enableSSML}`);

				// 调试日志:记录TTS输入参数
				this.logger.debug(`[CosyVoice] TTS请求 - 模型: ${model}, 音色: ${voice}, SSML: ${enableSSML}, 文本长度: ${text.length}`);

				// 验证音色
				const voiceInfo = getVoiceInfo(model, voice);
				if (!voiceInfo) {
					throw new NodeOperationError(
						this.getNode(),
						`Voice "${voice}" is not supported by model "${model}". Please select a valid voice.`,
					);
				}

				if (enableSSML && !voiceInfo.supportsSSML) {
					throw new NodeOperationError(
						this.getNode(),
						`Voice "${voice}" does not support SSML. Please select a voice that supports SSML or disable SSML mode.`,
					);
				}

				// 获取可选参数
				const options = this.getNodeParameter('options', i, {}) as Record<string, unknown>;

				// 调用 WebSocket API
				const result = await synthesizeSpeech(
					{
						text,
						model,
						voice,
						format: (options.format as 'mp3' | 'wav' | 'pcm' | 'opus') || 'wav',
						sampleRate: options.sampleRate as number,
						volume: options.volume as number,
						rate: options.rate as number,
						pitch: options.pitch as number,
						enableSSML,
						instruction: options.instruction as string,
						wordTimestampEnabled: options.wordTimestampEnabled as boolean,
						seed: options.seed as number,
						timeoutMs: options.timeout ? (options.timeout as number) * 1000 : undefined,
					},
					apiKey,
				);

				// 调试日志:记录TTS响应
				this.logger.debug(
					`[CosyVoice] TTS响应 - RequestID: ${result.requestId}, 字符数: ${result.characters}, 音频大小: ${result.audio.length} bytes`,
				);

				// 构建返回数据
				const format = (options.format as 'mp3' | 'wav' | 'pcm' | 'opus') || 'wav';
				const mimeType = `audio/${format}`;

				// 获取自定义配置
				const binaryPropertyName = (options.binaryPropertyName as string) || 'data';
				const defaultFileName = `cosyvoice_${Date.now()}.${format}`;
				const fileName = (options.fileName as string) || defaultFileName;

				// 使用 n8n 的 prepareBinaryData helper 方法正确准备二进制数据
				const binaryData = await this.helpers.prepareBinaryData(
					result.audio,
					fileName,
					mimeType,
				);

				returnData.push({
					json: {
						success: true,
						requestId: result.requestId,
						characters: result.characters,
						model,
						voice,
						format,
						fileName,
						...(result.words && { wordTimestamps: result.words }),
					},
					binary: {
						[binaryPropertyName]: binaryData,
					},
				});
			} catch (error) {
				if (error instanceof NodeOperationError) {
					throw error;
				}
				if (error instanceof Error) {
					throw new NodeOperationError(this.getNode(), `Error processing item ${i}: ${error.message}`, {
						itemIndex: i,
					});
				}
				throw error;
			}
		}

		return [returnData];
	}
}
