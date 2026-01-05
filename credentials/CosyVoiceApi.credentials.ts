/**
 * Aliyun DashScope CosyVoice API Credential
 * 用于配置阿里云百炼平台的 API Key
 */

import type { ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

export interface CosyVoiceApiCredentials {
	apiKey: string;
}

export class CosyVoiceApi implements ICredentialType {
	displayName = 'Aliyun DashScope API Key API';
	name = 'cosyVoiceApi';
	icon = 'file:../icons/cosyvoice.svg' as const;
	documentationUrl = 'https://help.aliyun.com/zh/model-studio/cosyvoice-websocket-api';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Enter your Aliyun DashScope API Key (sk-xxx)',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://dashscope.aliyuncs.com/api/v1',
			url: '/models',
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};
}
