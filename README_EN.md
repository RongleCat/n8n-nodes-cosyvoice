English | [简体中文](./README.md)

# n8n-nodes-cosyvoice

Aliyun CosyVoice TTS Node for n8n - Alibaba Cloud DashScope CosyVoice Text-to-Speech Node

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

## Features

- 🎙️ **Text-to-Speech**: Convert Chinese and English text to natural, fluent speech using Alibaba Cloud DashScope CosyVoice service
- 🌐 **WebSocket Real-time Synthesis**: Real-time speech synthesis based on WebSocket protocol with low latency
- 🎭 **Rich Voice Selection**: 100+ preset voices covering different ages, genders, scenarios, and dialects
- 🔄 **Multi-Model Support**: Supports CosyVoice v1/v2/v3-flash/v3-plus models
- 🎚️ **Fine Control**: Adjustable speech rate, pitch, volume, sample rate, and more
- 📝 **SSML Support**: SSML markup language for precise control over pauses, polyphones, emotions, etc.
- 🔄 **Batch Processing**: Concurrent processing of multiple items with independent connections

## Installation

### Community Node Installation

1. In n8n, click **Settings** > **Community Nodes**
2. Click **Add** and enter: `n8n-nodes-cosyvoice`
3. Click **Install** to install the node

For detailed installation guide, refer to [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/installation/)

## Credential Configuration

### Obtain Alibaba Cloud DashScope API Key

1. Visit [Alibaba Cloud DashScope Console](https://bailian.console.aliyun.com/)
2. Enable CosyVoice service (if not enabled)
3. Create an API Key (select "China (Beijing)" region)
4. Copy the API Key (format: `sk-xxx`)

### Configure Credentials in n8n

1. Create new credentials in n8n
2. Select **Aliyun DashScope API Key**
3. Paste your API Key
4. Save credentials

## Usage

### Basic Usage

1. Drag the **Aliyun CosyVoice** node to your workflow
2. Configure API Key credentials
3. Enter the text to convert
4. Select model and voice
5. Run the node to get the audio file

### Parameters

#### Required Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| **Text** | Text content to synthesize | "Hello, how are you?" |
| **Model** | CosyVoice model version | cosyvoice-v3-flash (recommended) |
| **Voice** | Voice selection | longanyang |

#### Optional Parameters

| Parameter | Description | Default | Range |
|-----------|-------------|---------|-------|
| **Format** | Audio format | mp3 | mp3/wav/pcm/opus |
| **Sample Rate** | Sample rate (Hz) | 22050 | 8000-48000 |
| **Volume** | Volume | 50 | 0-100 |
| **Rate** | Speech rate multiplier | 1.0 | 0.5-2.0 |
| **Pitch** | Pitch multiplier | 1.0 | 0.5-2.0 |
| **Instruction** | Emotion/scenario instruction | - | Only some voices support |
| **Word Timestamp** | Word-level timestamps | false | - |
| **Seed** | Random seed | 0 | 0-65535 |

### SSML Mode

Enable **Enable SSML** to input SSML markup language for more precise speech control:

```xml
<speak>
  Hello, how are you?<break time="500ms"/>
  I'm doing great.<break time="300ms"/>
  Thank you for asking.<break time="500ms"/>
</speak>
```

**SSML Features**:
- Pause control: `<break time="500ms"/>`
- Phoneme: `<phoneme alphabet="py" ph="zhòng4">重</phoneme>`
- Emphasis: `<emphasis level="strong">...</emphasis>`
- Speech rate: `<prosody rate="1.3">...</prosody>`

## Supported Models and Voices

### CosyVoice v3-flash (Recommended)

**Features**: Fast, high quality, supports SSML and Instruct

**Main Voices**:
- `longanyang` - Sunny boy voice
- `longanhuan` - Energetic girl voice
- `longhuhu_v3` - Innocent child voice
- And 28 more voices

### CosyVoice v3-plus

**Features**: High quality, slower speed, supports SSML and Instruct

**Main Voices**: Same as v3-flash, with 3 selected benchmark voices

### CosyVoice v2

**Features**: High quality, supports SSML, rich voice selection

**Main Voices**: 90+ voices including dialects (Cantonese, Northeastern, Shaanxi, etc.)

### CosyVoice v1

**Features**: Basic version, does not support SSML

**Main Voices**: 22 classic voices

For complete voice list, refer to [Alibaba Cloud Documentation](https://help.aliyun.com/zh/model-studio/cosyvoice-voice-list)

## Examples

### Example 1: Simple Text-to-Speech

```javascript
// Input
{
  "text": "Welcome to Alibaba Cloud DashScope CosyVoice speech synthesis service"
}

// Output
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

### Example 2: Batch Processing

```javascript
// Input (multiple items)
[
  { "text": "First paragraph" },
  { "text": "Second paragraph" },
  { "text": "Third paragraph" }
]

// Output (concurrent processing, independent connections per item)
[
  { "success": true, "binary": { "data": {...} } },
  { "success": true, "binary": { "data": {...} } },
  { "success": true, "binary": { "data": {...} } }
]
```

## Compatibility

- **n8n version**: >= 1.60.0
- **Node.js**: >= 18.x
- **OS**: Windows, macOS, Linux

## Important Notes

1. **API Key Security**: Do not hardcode API Keys in your code, use n8n credential management
2. **Character Limit**: Max 2000 characters per request, cumulative max 200,000 characters
3. **Model-Voice Matching**: Model and voice must match, otherwise an error will occur
4. **SSML Limitation**: Only v2/v3-flash/v3-plus and certain voices support SSML
5. **Concurrent Connections**: Each item uses an independent WebSocket connection, be aware of API rate limits

## Pricing

Refer to [Alibaba Cloud DashScope Pricing Documentation](https://help.aliyun.com/zh/model-studio/cosyvoice-websocket-api):

| Model | Price | Free Quota |
|-------|-------|------------|
| cosyvoice-v3-plus | ¥2/10k chars | 10k chars |
| cosyvoice-v3-flash | ¥1/10k chars | 10k chars |
| cosyvoice-v2 | ¥2/10k chars | 10k chars |
| cosyvoice-v1 | - | - |

## Resources

- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/#community-nodes)
- [CosyVoice WebSocket API Documentation](https://help.aliyun.com/zh/model-studio/cosyvoice-websocket-api)
- [CosyVoice Voice List](https://help.aliyun.com/zh/model-studio/cosyvoice-voice-list)
- [SSML Markup Language Introduction](https://help.aliyun.com/zh/model-studio/introduction-to-cosyvoice-ssml-markup-language)

## License

MIT

## Author

ronglecat <ronglecat@163.com>

## Feedback & Support

For questions or suggestions, please open an issue on [GitHub Issues](https://github.com/ronglecat/n8n-nodes-cosyvoice/issues).
