[English](./README_EN.md) | 简体中文

## 🚀 拒绝无效加班，掌握 n8n 自动化黑科技

想让工作更轻松?扫码关注微信公众号 **【曹工不加班】**,免费获取:

- 📚 **独家保姆级 n8n 实战教程**
- 🧩 **社区专享 VIP 节点**
- 💡 **高阶自动化工作流模板**

![曹工不加班](https://pic.fmcat.top/AI/other/gzh.webp)

---

# n8n-nodes-cosyvoice

Aliyun CosyVoice TTS Node for n8n - 阿里云百炼 CosyVoice 文字转语音节点

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

## 功能特性

- 🎙️ **文字转语音**: 使用阿里云百炼 CosyVoice 服务将中文、英文文本转换为自然流畅的语音
- 🌐 **WebSocket 实时合成**: 基于 WebSocket 协议的实时语音合成,低延迟
- 🎭 **丰富的音色选择**: 支持 100+ 预置音色,涵盖不同年龄、性别、场景和方言
- 🔄 **多模型支持**: 支持 CosyVoice v1/v2/v3-flash/v3-plus 模型
- 🎚️ **精细控制**: 支持语速、音调、音量、采样率等参数调节
- 📝 **SSML 支持**: 支持 SSML 标记语言,实现停顿、多音字、情感等精细控制
- 🔄 **批量处理**: 支持多个 item 并发处理,每个 item 独立连接互不冲突


## 安装

### 社区节点安装

1. 在 n8n 中，点击 **Settings** > **Community Nodes**
2. 点击 **Add**，输入：`n8n-nodes-cosyvoice`
3. 点击 **Install** 安装节点

详细安装指南请参考 [n8n 社区节点文档](https://docs.n8n.io/integrations/community-nodes/installation/)

## 凭证配置

### 获取阿里云百炼 API Key

1. 访问 [阿里云百炼控制台](https://bailian.console.aliyun.com/)
2. 开通 CosyVoice 服务（如未开通）
3. 创建 API Key（选择"中国大陆（北京）"地域）
4. 复制 API Key（格式：`sk-xxx`）

### 在 n8n 中配置凭证

1. 在 n8n 中创建新凭据
2. 选择 **Aliyun DashScope API Key**
3. 粘贴您的 API Key
4. 保存凭据

## 使用方法

### 基础用法

1. 拖拽 **Aliyun CosyVoice** 节点到工作流
2. 配置 API Key 凭证
3. 输入待转换的文本
4. 选择模型和音色
5. 运行节点获取音频文件

### 参数说明

#### 必填参数

| 参数 | 说明 | 示例 |
|-----|------|------|
| **Text** | 待合成的文本内容 | "今天天气真不错" |
| **Model** | CosyVoice 模型版本 | cosyvoice-v3-flash（推荐） |
| **Voice** | 音色选择 | longanyang（龙安洋） |

#### 可选参数

| 参数 | 说明 | 默认值 | 范围 |
|-----|------|--------|------|
| **Format** | 音频格式 | mp3 | mp3/wav/pcm/opus |
| **Sample Rate** | 采样率 (Hz) | 22050 | 8000-48000 |
| **Volume** | 音量 | 50 | 0-100 |
| **Rate** | 语速倍率 | 1.0 | 0.5-2.0 |
| **Pitch** | 音调倍率 | 1.0 | 0.5-2.0 |
| **Instruction** | 情感/场景指令 | - | 仅部分音色支持 |
| **Word Timestamp** | 字级别时间戳 | false | - |
| **Seed** | 随机种子 | 0 | 0-65535 |

### SSML 模式

#### 方式 1: 直接输入 SSML

开启 **Enable SSML** 后可以直接输入 SSML 标记语言实现更精细的语音控制：

```xml
<speak>
  今天天气真不错<break time="500ms"/>
  我们去公园玩吧<break time="300ms"/>
  怎么样<break time="500ms"/>
</speak>
```

**SSML 功能**：
- 停顿控制：`<break time="500ms"/>`
- 多音字：`<phoneme alphabet="py" ph="zhòng4">重</phoneme>`
- 情感强调：`<emphasis level="strong">...</emphasis>`
- 语速调整：`<prosody rate="1.3">...</prosody>`


## 支持的模型和音色

### CosyVoice v3-flash（推荐）

**特点**：速度快、质量高、支持 SSML 和 Instruct

**主要音色**：
- `longanyang` - 龙安洋（阳光大男孩）
- `longanhuan` - 龙安欢（欢脱元气女）
- `longhuhu_v3` - 龙呼呼（天真烂漫女童）
- 等 28 个音色

### CosyVoice v3-plus

**特点**：高质量、速度较慢、支持 SSML 和 Instruct

**主要音色**：同 v3-flash，精选 3 个标杆音色

### CosyVoice v2

**特点**：高质量、支持 SSML、音色丰富

**主要音色**：90+ 个音色，包含方言（粤语、东北话、陕北话等）

### CosyVoice v1

**特点**：基础版本、不支持 SSML

**主要音色**：22 个经典音色

完整音色列表请参考 [阿里云文档](https://help.aliyun.com/zh/model-studio/cosyvoice-voice-list)

## 使用示例

### 示例 1：简单文字转语音

```javascript
// 输入
{
  "text": "欢迎使用阿里云百炼 CosyVoice 语音合成服务"
}

// 输出
{
  "success": true,
  "requestId": "0a9dba9e-d3a6-45a4-be6d-xxx",
  "characters": 24,
  "model": "cosyvoice-v3-flash",
  "voice": "longanyang",
  "format": "mp3",
  "duration": 15280
}
// Binary: audio data (MP3 file)
```

### 示例 2：批量处理

```javascript
// 输入（多个 item）
[
  { "text": "第一段文本" },
  { "text": "第二段文本" },
  { "text": "第三段文本" }
]

// 输出（并发处理，每个 item 独立连接）
[
  { "success": true, "binary": { "data": {...} } },
  { "success": true, "binary": { "data": {...} } },
  { "success": true, "binary": { "data": {...} } }
]
```


## 兼容性

- **n8n 版本**: >= 1.60.0
- **Node.js**: >= 18.x
- **操作系统**: Windows, macOS, Linux

## 注意事项

1. **API Key 安全**: 请勿将 API Key 硬编码到代码中，使用 n8n 凭证管理
2. **字符限制**: 单次文本不超过 2000 字符，累计不超过 20 万字符
3. **模型音色匹配**: model 和 voice 必须匹配，否则会报错
4. **SSML 限制**: 仅 v2/v3-flash/v3-plus 及部分音色支持 SSML
5. **并发连接**: 每个 item 使用独立的 WebSocket 连接，注意 API 限流

## 计费

参考 [阿里云百炼计费文档](https://help.aliyun.com/zh/model-studio/cosyvoice-websocket-api)：

| 模型 | 单价 | 免费额度 |
|-----|------|---------|
| cosyvoice-v3-plus | 2元/万字符 | 1万字符 |
| cosyvoice-v3-flash | 1元/万字符 | 1万字符 |
| cosyvoice-v2 | 2元/万字符 | 1万字符 |
| cosyvoice-v1 | - | - |

## 资源链接

- [n8n 社区节点文档](https://docs.n8n.io/integrations/#community-nodes)
- [CosyVoice WebSocket API 文档](https://help.aliyun.com/zh/model-studio/cosyvoice-websocket-api)
- [CosyVoice 音色列表](https://help.aliyun.com/zh/model-studio/cosyvoice-voice-list)
- [SSML 标记语言介绍](https://help.aliyun.com/zh/model-studio/introduction-to-cosyvoice-ssml-markup-language)

## 许可证

MIT

## 作者

ronglecat <ronglecat@163.com>

## 反馈与支持

如有问题或建议，请在 [GitHub Issues](https://github.com/ronglecat/n8n-nodes-cosyvoice/issues) 中提出。
