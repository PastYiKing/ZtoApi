declare namespace Deno {
    interface Conn {
      readonly rid: number;
      localAddr: Addr;
      remoteAddr: Addr;
      read(p: Uint8Array): Promise<number | null>;
      write(p: Uint8Array): Promise<number>;
      close(): void;
    }
    
    interface Addr {
      hostname: string;
      port: number;
      transport: string;
    }
    
    interface Listener extends AsyncIterable<Conn> {
      readonly addr: Addr;
      accept(): Promise<Conn>;
      close(): void;
      [Symbol.asyncIterator](): AsyncIterableIterator<Conn>;
    }
    
    interface HttpConn {
      nextRequest(): Promise<RequestEvent | null>;
      [Symbol.asyncIterator](): AsyncIterableIterator<RequestEvent>;
    }
    
    interface RequestEvent {
      request: Request;
      respondWith(r: Response | Promise<Response>): Promise<void>;
    }
    
    function listen(options: { port: number }): Listener;
    function serveHttp(conn: Conn): HttpConn;
    function serve(handler: (request: Request) => Promise<Response>): void;
    
    namespace env {
      function get(key: string): string | undefined;
    }
  }
  
  /**
   * 请求统计信息接口
   * 用于跟踪API调用的各项指?
   */
  interface RequestStats {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    lastRequestTime: Date;
    averageResponseTime: number;
  }
  
  /**
   * 实时请求信息接口
   * 用于Dashboard显示最近的API请求记录
   */
  interface LiveRequest {
    id: string;
    timestamp: Date;
    method: string;
    path: string;
    status: number;
    duration: number;
    userAgent: string;
    model?: string;
  }
  
  /**
   * OpenAI兼容请求结构
   * 标准的聊天完成API请求格式
   */
  interface OpenAIRequest {
    model: string;
    messages: Message[];
    stream?: boolean;
    temperature?: number;
    max_tokens?: number;
  }
  
  /**
   * 聊天消息结构
   * 支持全方位多模态内容：文本、图像、视频、文?
   */
  interface Message {
    role: string;
    content: string | Array<{
      type: string;
      text?: string;
      image_url?: {url: string};
      video_url?: {url: string};
      document_url?: {url: string};
      audio_url?: {url: string};
    }>;
  }
  
  /**
   * 上游服务请求结构
   * 向Z.ai服务发送的请求格式
   */
  interface UpstreamRequest {
    stream: boolean;
    model: string;
    messages: Message[];
    params: Record<string, unknown>;
    features: Record<string, unknown>;
    background_tasks?: Record<string, boolean>;
    chat_id?: string;
    id?: string;
    mcp_servers?: string[];
    model_item?: {
      id: string;
      name: string;
      owned_by: string;
      openai?: any;
      urlIdx?: number;
      info?: any;
      actions?: any[];
      tags?: any[];
    };
    tool_servers?: string[];
    variables?: Record<string, string>;
  }
  
  /**
   * OpenAI兼容响应结构
   */
  interface OpenAIResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Choice[];
    usage?: Usage;
  }
  
  interface Choice {
    index: number;
    message?: Message;
    delta?: Delta;
    finish_reason?: string;
  }
  
  interface Delta {
    role?: string;
    content?: string;
  }
  
  interface Usage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  }
  
  /**
   * 上游SSE数据结构
   */
  interface UpstreamData {
    type: string;
    data: {
      delta_content: string;
      phase: string;
      done: boolean;
      usage?: Usage;
      error?: UpstreamError;
      inner?: {
        error?: UpstreamError;
      };
    };
    error?: UpstreamError;
  }
  
  interface UpstreamError {
    detail: string;
    code: number;
  }
  
  interface ModelsResponse {
    object: string;
    data: Model[];
  }
  
  interface Model {
    id: string;
    object: string;
    created: number;
    owned_by: string;
  }
  
  /**
   * 配置常量定义
   */
  
  // 思考内容处理策? strip-去除<details>标签, think-转为<thinking>标签, raw-保留原样
  const THINK_TAGS_MODE = "strip";
  
  // 伪装前端头部（来自抓包分析）
  const X_FE_VERSION = "prod-fe-1.0.70";
  const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0";
  const SEC_CH_UA = "\"Not;A=Brand\";v=\"99\", \"Microsoft Edge\";v=\"139\", \"Chromium\";v=\"139\"";
  const SEC_CH_UA_MOB = "?0";
  const SEC_CH_UA_PLAT = "\"Windows\"";
  const ORIGIN_BASE = "https://chat.z.ai";
  
  const ANON_TOKEN_ENABLED = true;
  
  /**
   * 环境变量配置
   */
  const UPSTREAM_URL = Deno.env.get("UPSTREAM_URL") || "https://chat.z.ai/api/chat/completions";
  const DEFAULT_KEY = Deno.env.get("DEFAULT_KEY") || "sk-your-key";
  const ZAI_TOKEN = Deno.env.get("ZAI_TOKEN") || "";
  
  /**
   * 支持的模型配?
   */
  interface ModelConfig {
    id: string;           // OpenAI API中的模型ID
    name: string;         // 显示名称
    upstreamId: string;   // Z.ai上游的模型ID
    capabilities: {
      vision: boolean;
      mcp: boolean;
      thinking: boolean;
    };
    defaultParams: {
      top_p: number;
      temperature: number;
      max_tokens?: number;
    };
  }
  
  const SUPPORTED_MODELS: ModelConfig[] = [
    {
      id: "0727-360B-API",
      name: "GLM-4.5",
      upstreamId: "0727-360B-API",
      capabilities: {
        vision: false,
        mcp: true,
        thinking: true
      },
      defaultParams: {
        top_p: 0.95,
        temperature: 0.6,
        max_tokens: 80000
      }
    },
    {
      id: "glm-4.5v",
      name: "GLM-4.5V",
      upstreamId: "glm-4.5v",
      capabilities: {
        vision: true,
        mcp: false,
        thinking: true
      },
      defaultParams: {
        top_p: 0.6,
        temperature: 0.8
      }
    }
  ];
  
  // 默认模型
  const DEFAULT_MODEL = SUPPORTED_MODELS[0];
  
  // 根据模型ID获取配置
  function getModelConfig(modelId: string): ModelConfig {
    // 标准化模型ID，处理Cherry Studio等客户端的大小写差异
    const normalizedModelId = normalizeModelId(modelId);
    const found = SUPPORTED_MODELS.find(m => m.id === normalizedModelId);
    
    if (!found) {
      debugLog("⚠️ 未找到模型配? %s (标准化后: %s)，使用默认模? %s", 
        modelId, normalizedModelId, DEFAULT_MODEL.name);
    }
    
    return found || DEFAULT_MODEL;
  }
  
  /**
   * 标准化模型ID，处理不同客户端的命名差?
   * Cherry Studio等客户端可能使用不同的大小写格式
   */
  function normalizeModelId(modelId: string): string {
    const normalized = modelId.toLowerCase().trim();
    
    // 处理常见的模型ID映射
    const modelMappings: Record<string, string> = {
      'glm-4.5v': 'glm-4.5v',
      'glm4.5v': 'glm-4.5v',
      'glm_4.5v': 'glm-4.5v',
      'gpt-4-vision-preview': 'glm-4.5v',  // 向后兼容
      '0727-360b-api': '0727-360B-API',
      'glm-4.5': '0727-360B-API',
      'glm4.5': '0727-360B-API',
      'glm_4.5': '0727-360B-API',
      'gpt-4': '0727-360B-API'  // 向后兼容
    };
    
    const mapped = modelMappings[normalized];
    if (mapped) {
      debugLog("🔄 模型ID映射: %s ?%s", modelId, mapped);
      return mapped;
    }
    
    return normalized;
  }
  
  /**
   * 处理和验证全方位多模态消?
   * 支持图像、视频、文档、音频等多种媒体类型
   */
  function processMessages(messages: Message[], modelConfig: ModelConfig): Message[] {
    const processedMessages: Message[] = [];
    
    for (const message of messages) {
      const processedMessage: Message = { ...message };
      
      // 检查是否为多模态消?
      if (Array.isArray(message.content)) {
        debugLog("检测到多模态消息，内容块数? %d", message.content.length);
        
        // 统计各种媒体类型
        const mediaStats = {
          text: 0,
          images: 0,
          videos: 0,
          documents: 0,
          audios: 0,
          others: 0
        };
        
        // 验证模型是否支持多模态
        if (!modelConfig.capabilities.vision) {
          debugLog("警告: 模型 %s 不支持多模态，但收到了多模态消息", modelConfig.name);
          // 只保留文本内容
          const textContent = message.content
            .filter(block => block.type === 'text')
            .map(block => block.text)
            .join('\n');
          processedMessage.content = textContent;
        } else {
          // GLM-4.5V 支持全方位多模态，处理所有内容类?
          for (const block of message.content) {
            switch (block.type) {
              case 'text':
                if (block.text) {
                  mediaStats.text++;
                  debugLog("📝 文本内容，长? %d", block.text.length);
                }
                break;
                
              case 'image_url':
                if (block.image_url?.url) {
                  mediaStats.images++;
                  const url = block.image_url.url;
                  if (url.startsWith('data:image/')) {
                    const mimeMatch = url.match(/data:image\/([^;]+)/);
                    const format = mimeMatch ? mimeMatch[1] : 'unknown';
                    debugLog("🖼?图像数据: %s格式, 大小: %d字符", format, url.length);
                  } else if (url.startsWith('http')) {
                    debugLog("🔗 图像URL: %s", url);
                  } else {
                    debugLog("⚠️ 未知图像格式: %s", url.substring(0, 50));
                  }
                }
                break;
                
              case 'video_url':
                if (block.video_url?.url) {
                  mediaStats.videos++;
                  const url = block.video_url.url;
                  if (url.startsWith('data:video/')) {
                    const mimeMatch = url.match(/data:video\/([^;]+)/);
                    const format = mimeMatch ? mimeMatch[1] : 'unknown';
                    debugLog("🎥 视频数据: %s格式, 大小: %d字符", format, url.length);
                  } else if (url.startsWith('http')) {
                    debugLog("🔗 视频URL: %s", url);
                  } else {
                    debugLog("⚠️ 未知视频格式: %s", url.substring(0, 50));
                  }
                }
                break;
                
              case 'document_url':
                if (block.document_url?.url) {
                  mediaStats.documents++;
                  const url = block.document_url.url;
                  if (url.startsWith('data:application/')) {
                    const mimeMatch = url.match(/data:application\/([^;]+)/);
                    const format = mimeMatch ? mimeMatch[1] : 'unknown';
                    debugLog("📄 文档数据: %s格式, 大小: %d字符", format, url.length);
                  } else if (url.startsWith('http')) {
                    debugLog("🔗 文档URL: %s", url);
                  } else {
                    debugLog("⚠️ 未知文档格式: %s", url.substring(0, 50));
                  }
                }
                break;
                
              case 'audio_url':
                if (block.audio_url?.url) {
                  mediaStats.audios++;
                  const url = block.audio_url.url;
                  if (url.startsWith('data:audio/')) {
                    const mimeMatch = url.match(/data:audio\/([^;]+)/);
                    const format = mimeMatch ? mimeMatch[1] : 'unknown';
                    debugLog("🎵 音频数据: %s格式, 大小: %d字符", format, url.length);
                  } else if (url.startsWith('http')) {
                    debugLog("🔗 音频URL: %s", url);
                  } else {
                    debugLog("⚠️ 未知音频格式: %s", url.substring(0, 50));
                  }
                }
                break;
                
              default:
                mediaStats.others++;
                debugLog("?未知内容类型: %s", block.type);
            }
          }
          
          // 输出统计信息
          const totalMedia = mediaStats.images + mediaStats.videos + mediaStats.documents + mediaStats.audios;
          if (totalMedia > 0) {
            debugLog("🎯 多模态内容统? 文本(%d) 图像(%d) 视频(%d) 文档(%d) 音频(%d)", 
              mediaStats.text, mediaStats.images, mediaStats.videos, mediaStats.documents, mediaStats.audios);
          }
        }
      } else if (typeof message.content === 'string') {
        debugLog("📝 纯文本消息，长度: %d", message.content.length);
      }
      
      processedMessages.push(processedMessage);
    }
    
    return processedMessages;
  }
  
  const DEBUG_MODE = Deno.env.get("DEBUG_MODE") !== "false"; // 默认为true
  const DEFAULT_STREAM = Deno.env.get("DEFAULT_STREAM") !== "false"; // 默认为true
  const DASHBOARD_ENABLED = Deno.env.get("DASHBOARD_ENABLED") !== "false"; // 默认为true
  
  /**
   * 全局状态变?
   */
  
  let stats: RequestStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    lastRequestTime: new Date(),
    averageResponseTime: 0
  };
  
  let liveRequests: LiveRequest[] = [];
  
  /**
   * 工具函数
   */
  
  function debugLog(format: string, ...args: unknown[]): void {
    if (DEBUG_MODE) {
      console.log(`[DEBUG] ${format}`, ...args);
    }
  }
  
  function recordRequestStats(startTime: number, path: string, status: number): void {
    const duration = Date.now() - startTime;
    
    stats.totalRequests++;
    stats.lastRequestTime = new Date();
    
    if (status >= 200 && status < 300) {
      stats.successfulRequests++;
    } else {
      stats.failedRequests++;
    }
    
    // 更新平均响应时间
    if (stats.totalRequests > 0) {
      const totalDuration = stats.averageResponseTime * (stats.totalRequests - 1) + duration;
      stats.averageResponseTime = totalDuration / stats.totalRequests;
    } else {
      stats.averageResponseTime = duration;
    }
  }
  
  function addLiveRequest(method: string, path: string, status: number, duration: number, userAgent: string, model?: string): void {
    const request: LiveRequest = {
      id: Date.now().toString(),
      timestamp: new Date(),
      method,
      path,
      status,
      duration,
      userAgent,
      model
    };
    
    liveRequests.push(request);
    
    // 只保留最近的100条请?
    if (liveRequests.length > 100) {
      liveRequests = liveRequests.slice(1);
    }
  }
  
  function getLiveRequestsData(): string {
    try {
      // 确保liveRequests是数组
      if (!Array.isArray(liveRequests)) {
        debugLog("liveRequests不是数组，重置为空数组");
        liveRequests = [];
      }
      
      // 确保返回的数据格式与前端期望的一致
      const requestData = liveRequests.map(req => ({
        id: req.id || "",
        timestamp: req.timestamp || new Date(),
        method: req.method || "",
        path: req.path || "",
        status: req.status || 0,
        duration: req.duration || 0,
        user_agent: req.userAgent || ""
      }));
      
      return JSON.stringify(requestData);
    } catch (error) {
      debugLog("获取实时请求数据失败: %v", error);
      return JSON.stringify([]);
    }
  }
  
  function getStatsData(): string {
    try {
      // 确保stats对象存在
      if (!stats) {
        debugLog("stats对象不存在，使用默认值");
        stats = {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          lastRequestTime: new Date(),
          averageResponseTime: 0
        };
      }
      
      // 确保返回的数据格式与前端期望的一?
      const statsData = {
        totalRequests: stats.totalRequests || 0,
        successfulRequests: stats.successfulRequests || 0,
        failedRequests: stats.failedRequests || 0,
        averageResponseTime: stats.averageResponseTime || 0
      };
      
      return JSON.stringify(statsData);
    } catch (error) {
      debugLog("获取统计数据失败: %v", error);
      return JSON.stringify({
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0
      });
    }
  }
  
  function getClientIP(request: Request): string {
    // 检查X-Forwarded-For?
    const xff = request.headers.get("X-Forwarded-For");
    if (xff) {
      const ips = xff.split(",");
      if (ips.length > 0) {
        return ips[0].trim();
      }
    }
    
    // 检查X-Real-IP?
    const xri = request.headers.get("X-Real-IP");
    if (xri) {
      return xri;
    }
    
    // 对于Deno Deploy，我们无法直接获取RemoteAddr，返回一个默认?
    return "unknown";
  }
  
  function setCORSHeaders(headers: Headers): void {
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    headers.set("Access-Control-Allow-Credentials", "true");
  }
  
  function validateApiKey(authHeader: string | null): boolean {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return false;
    }
    
    const apiKey = authHeader.substring(7);
    return apiKey === DEFAULT_KEY;
  }
  
  async function getAnonymousToken(): Promise<string> {
    try {
      const response = await fetch(`${ORIGIN_BASE}/api/v1/auths/`, {
        method: "GET",
        headers: {
          "User-Agent": BROWSER_UA,
          "Accept": "*/*",
          "Accept-Language": "zh-CN,zh;q=0.9",
          "X-FE-Version": X_FE_VERSION,
          "sec-ch-ua": SEC_CH_UA,
          "sec-ch-ua-mobile": SEC_CH_UA_MOB,
          "sec-ch-ua-platform": SEC_CH_UA_PLAT,
          "Origin": ORIGIN_BASE,
          "Referer": `${ORIGIN_BASE}/`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Anonymous token request failed with status ${response.status}`);
      }
      
      const data = await response.json() as { token: string };
      if (!data.token) {
        throw new Error("Anonymous token is empty");
      }
      
      return data.token;
    } catch (error) {
      debugLog("获取匿名token失败: %v", error);
      throw error;
    }
  }
  
  // 调用上游API
  async function callUpstreamWithHeaders(
    upstreamReq: UpstreamRequest, 
    refererChatID: string, 
    authToken: string
  ): Promise<Response> {
    try {
      debugLog("调用上游API: %s", UPSTREAM_URL);
      
      // 特别检查和记录全方位多模态内?
      const hasMultimedia = upstreamReq.messages.some(msg => 
        Array.isArray(msg.content) && 
        msg.content.some(block => 
          ['image_url', 'video_url', 'document_url', 'audio_url'].includes(block.type)
        )
      );
      
      if (hasMultimedia) {
        debugLog("🎯 请求包含多模态数据，正在发送到上游...");
        
        for (let i = 0; i < upstreamReq.messages.length; i++) {
          const msg = upstreamReq.messages[i];
          if (Array.isArray(msg.content)) {
            for (let j = 0; j < msg.content.length; j++) {
              const block = msg.content[j];
              
              // 处理图像
              if (block.type === 'image_url' && block.image_url?.url) {
                const url = block.image_url.url;
                if (url.startsWith('data:image/')) {
                  const mimeMatch = url.match(/data:image\/([^;]+)/);
                  const format = mimeMatch ? mimeMatch[1] : 'unknown';
                  const sizeKB = Math.round(url.length * 0.75 / 1024); // base64 大约是原文件?1.33 ?
                  debugLog("🖼️消息[%d] 图像[%d]: %s格式, 数据长度: %d字符 (~%dKB)", 
                    i, j, format, url.length, sizeKB);
                  
                  // 图片大小警告
                  if (sizeKB > 1000) {
                    debugLog("⚠️  图片较大 (%dKB)，可能导致上游处理失败", sizeKB);
                    debugLog("💡 建议: 将图片压缩到 500KB 以下");
                  } else if (sizeKB > 500) {
                    debugLog("⚠️  图片偏大 (%dKB)，建议压缩", sizeKB);
                  }
                } else {
                  debugLog("🔗 消息[%d] 图像[%d]: 外部URL - %s", i, j, url);
                }
              }
              
              // 处理视频
              if (block.type === 'video_url' && block.video_url?.url) {
                const url = block.video_url.url;
                if (url.startsWith('data:video/')) {
                  const mimeMatch = url.match(/data:video\/([^;]+)/);
                  const format = mimeMatch ? mimeMatch[1] : 'unknown';
                  debugLog("🎥 消息[%d] 视频[%d]: %s格式, 数据长度: %d字符", 
                    i, j, format, url.length);
                } else {
                  debugLog("🔗 消息[%d] 视频[%d]: 外部URL - %s", i, j, url);
                }
              }
              
              // 处理文档
              if (block.type === 'document_url' && block.document_url?.url) {
                const url = block.document_url.url;
                if (url.startsWith('data:application/')) {
                  const mimeMatch = url.match(/data:application\/([^;]+)/);
                  const format = mimeMatch ? mimeMatch[1] : 'unknown';
                  debugLog("📄 消息[%d] 文档[%d]: %s格式, 数据长度: %d字符", 
                    i, j, format, url.length);
                } else {
                  debugLog("🔗 消息[%d] 文档[%d]: 外部URL - %s", i, j, url);
                }
              }
              
              // 处理音频
              if (block.type === 'audio_url' && block.audio_url?.url) {
                const url = block.audio_url.url;
                if (url.startsWith('data:audio/')) {
                  const mimeMatch = url.match(/data:audio\/([^;]+)/);
                  const format = mimeMatch ? mimeMatch[1] : 'unknown';
                  debugLog("🎵 消息[%d] 音频[%d]: %s格式, 数据长度: %d字符", 
                    i, j, format, url.length);
                } else {
                  debugLog("🔗 消息[%d] 音频[%d]: 外部URL - %s", i, j, url);
                }
              }
            }
          }
        }
      }
      
      debugLog("上游请求? %s", JSON.stringify(upstreamReq));
      
      const response = await fetch(UPSTREAM_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "User-Agent": BROWSER_UA,
          "Authorization": `Bearer ${authToken}`,
          "Accept-Language": "zh-CN",
          "sec-ch-ua": SEC_CH_UA,
          "sec-ch-ua-mobile": SEC_CH_UA_MOB,
          "sec-ch-ua-platform": SEC_CH_UA_PLAT,
          "X-FE-Version": X_FE_VERSION,
          "Origin": ORIGIN_BASE,
          "Referer": `${ORIGIN_BASE}/c/${refererChatID}`
        },
        body: JSON.stringify(upstreamReq)
      });
      
      debugLog("上游响应状? %d %s", response.status, response.statusText);
      return response;
    } catch (error) {
      debugLog("调用上游失败: %v", error);
      throw error;
    }
  }
  
  function transformThinking(content: string): string {
    // ?<summary>?/summary>
    let result = content.replace(/<summary>.*?<\/summary>/gs, "");
    // 清理残留自定义标签，?</thinking>?Full> ?
    result = result.replace(/<\/thinking>/g, "");
    result = result.replace(/<Full>/g, "");
    result = result.replace(/<\/Full>/g, "");
    result = result.trim();
    
    switch (THINK_TAGS_MODE as "strip" | "think" | "raw") {
      case "think":
        result = result.replace(/<details[^>]*>/g, "<thinking>");
        result = result.replace(/<\/details>/g, "</thinking>");
        break;
      case "strip":
        result = result.replace(/<details[^>]*>/g, "");
        result = result.replace(/<\/details>/g, "");
        break;
    }
    
    // 处理每行前缀 "> "（包括起始位置）
    result = result.replace(/^> /, "");
    result = result.replace(/\n> /g, "\n");
    return result.trim();
  }
  
  async function processUpstreamStream(
    body: ReadableStream<Uint8Array>,
    writer: WritableStreamDefaultWriter<Uint8Array>,
    encoder: TextEncoder,
    modelName: string
  ): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ""; // 保留最后一个不完整的行
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.substring(6);
            if (dataStr === "") continue;
            
            debugLog("收到SSE数据: %s", dataStr);
            
            try {
              const upstreamData = JSON.parse(dataStr) as UpstreamData;
              
              // 错误检?
              if (upstreamData.error || upstreamData.data.error || 
                  (upstreamData.data.inner && upstreamData.data.inner.error)) {
                const errObj = upstreamData.error || upstreamData.data.error || 
                             (upstreamData.data.inner && upstreamData.data.inner.error);
                debugLog("上游错误: code=%d, detail=%s", errObj?.code, errObj?.detail);
                
                // 分析错误类型，特别是多模态相关错?
                const errorDetail = (errObj?.detail || "").toLowerCase();
                if (errorDetail.includes("something went wrong") || errorDetail.includes("try again later")) {
                  debugLog("🚨 Z.ai 服务器错误分?");
                  debugLog("   📋 错误详情: %s", errObj?.detail);
                  debugLog("   🖼️ 可能原因: 图片处理失败");
                  debugLog("   💡 建议解决方案:");
                  debugLog("      1. 使用更小的图片(< 500KB)");
                  debugLog("      2. 尝试不同的图片格式(JPEG 而不是PNG)");
                  debugLog("      3. 稍后重试 (可能是服务器负载问题)");
                  debugLog("      4. 检查图片是否损坏");
                }
                
                // 发送结束chunk
                const endChunk: OpenAIResponse = {
                  id: `chatcmpl-${Date.now()}`,
                  object: "chat.completion.chunk",
                  created: Math.floor(Date.now() / 1000),
                  model: modelName,
                  choices: [
                    {
                      index: 0,
                      delta: {},
                      finish_reason: "stop"
                    }
                  ]
                };
                
                await writer.write(encoder.encode(`data: ${JSON.stringify(endChunk)}\n\n`));
                await writer.write(encoder.encode("data: [DONE]\n\n"));
                return;
              }
              
              debugLog("解析成功 - 类型: %s, 阶段: %s, 内容长度: %d, 完成: %v",
                upstreamData.type, upstreamData.data.phase, 
                upstreamData.data.delta_content ? upstreamData.data.delta_content.length : 0, 
                upstreamData.data.done);
              
              // 处理内容
              if (upstreamData.data.delta_content && upstreamData.data.delta_content !== "") {
                let out = upstreamData.data.delta_content;
                if (upstreamData.data.phase === "thinking") {
                  out = transformThinking(out);
                }
                
                if (out !== "") {
                  debugLog("发送内?%s): %s", upstreamData.data.phase, out);
                  
                  const chunk: OpenAIResponse = {
                    id: `chatcmpl-${Date.now()}`,
                    object: "chat.completion.chunk",
                    created: Math.floor(Date.now() / 1000),
                    model: modelName,
                    choices: [
                      {
                        index: 0,
                        delta: { content: out }
                      }
                    ]
                  };
                  
                  await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                }
              }
              
              // 检查是否结?
              if (upstreamData.data.done || upstreamData.data.phase === "done") {
                debugLog("检测到流结束信号");
                
                // 发送结束chunk
                const endChunk: OpenAIResponse = {
                  id: `chatcmpl-${Date.now()}`,
                  object: "chat.completion.chunk",
                  created: Math.floor(Date.now() / 1000),
                  model: modelName,
                  choices: [
                    {
                      index: 0,
                      delta: {},
                      finish_reason: "stop"
                    }
                  ]
                };
                
                await writer.write(encoder.encode(`data: ${JSON.stringify(endChunk)}\n\n`));
                await writer.write(encoder.encode("data: [DONE]\n\n"));
                return;
              }
            } catch (error) {
              debugLog("SSE数据解析失败: %v", error);
            }
          }
        }
      }
    } finally {
      writer.close();
    }
  }
  
  // 收集完整响应（用于非流式响应?
  async function collectFullResponse(body: ReadableStream<Uint8Array>): Promise<string> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullContent = "";
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ""; // 保留最后一个不完整的行
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.substring(6);
            if (dataStr === "") continue;
            
            try {
              const upstreamData = JSON.parse(dataStr) as UpstreamData;
              
              if (upstreamData.data.delta_content !== "") {
                let out = upstreamData.data.delta_content;
                if (upstreamData.data.phase === "thinking") {
                  out = transformThinking(out);
                }
                
                if (out !== "") {
                  fullContent += out;
                }
              }
              
              // 检查是否结束
              if (upstreamData.data.done || upstreamData.data.phase === "done") {
                debugLog("检测到完成信号，停止收集");
                return fullContent;
              }
            } catch (error) {
              // 忽略解析错误
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
    
    return fullContent;
  }
  
  /**
   * HTTP服务器和路由处理
   */
  
  function getIndexHTML(): string {
    return `<!DOCTYPE html>
  <html lang="zh-CN">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>公益API - OpenAI兼容接口服务</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/css/bootstrap.min.css" rel="stylesheet">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
          * {
              box-sizing: border-box;
          }
          
          body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 16px;
              line-height: 1.6;
              color: #2c3e50;
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              margin: 0;
              padding: 0;
              min-height: 100vh;
          }
          
          .main-container {
              max-width: 1200px;
              margin: 0 auto;
              padding: 40px 20px;
          }
          
          .hero-section {
              background: white;
              border-radius: 16px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
              padding: 60px 40px;
              text-align: center;
              margin-bottom: 40px;
              border: 1px solid rgba(0, 0, 0, 0.05);
          }
          
          .logo {
              width: 80px;
              height: 80px;
              background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
              border-radius: 20px;
              margin: 0 auto 24px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 32px;
              font-weight: 700;
              letter-spacing: -1px;
          }
          
          h1 {
              font-size: 3rem;
              font-weight: 700;
              color: #1e3a8a;
              margin: 0 0 16px 0;
              letter-spacing: -0.02em;
          }
          
          .subtitle {
              font-size: 1.25rem;
              color: #64748b;
              margin: 0 0 24px 0;
              font-weight: 500;
          }
          
          .description {
              font-size: 1.1rem;
              color: #475569;
              max-width: 600px;
              margin: 0 auto;
              line-height: 1.7;
          }
          
          .nav-cards {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
              gap: 24px;
              margin: 40px 0;
          }
          
          .nav-card {
              background: white;
              border-radius: 16px;
              padding: 32px;
              text-align: center;
              border: 1px solid rgba(0, 0, 0, 0.05);
              box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              position: relative;
              overflow: hidden;
          }
          
          .nav-card::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 4px;
              background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
              transform: translateX(-100%);
              transition: transform 0.3s ease;
          }
          
          .nav-card:hover::before {
              transform: translateX(0);
          }
          
          .nav-card:hover {
              transform: translateY(-8px);
              box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
              border-color: rgba(59, 130, 246, 0.1);
          }
          
          .nav-card-icon {
              width: 64px;
              height: 64px;
              background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
              border-radius: 16px;
              margin: 0 auto 24px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 24px;
              transition: all 0.3s ease;
          }
          
          .nav-card:hover .nav-card-icon {
              background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
              color: white;
              transform: scale(1.1);
          }
          
          .nav-card h3 {
              font-size: 1.5rem;
              font-weight: 600;
              color: #1e3a8a;
              margin: 0 0 12px 0;
          }
          
          .nav-card p {
              color: #64748b;
              margin: 0 0 24px 0;
              line-height: 1.6;
          }
          
          .nav-card-btn {
              display: inline-flex;
              align-items: center;
              padding: 12px 24px;
              background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 500;
              transition: all 0.3s ease;
              border: 2px solid transparent;
          }
          
          .nav-card-btn:hover {
              background: white;
              color: #1e3a8a;
              border-color: #1e3a8a;
              text-decoration: none;
              transform: translateY(-2px);
          }
          
          .features-section {
              background: white;
              border-radius: 16px;
              padding: 48px 40px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
              border: 1px solid rgba(0, 0, 0, 0.05);
              margin: 40px 0;
          }
          
          .features-title {
              text-align: center;
              font-size: 2.5rem;
              font-weight: 700;
              color: #1e3a8a;
              margin: 0 0 48px 0;
              position: relative;
          }
          
          .features-title::after {
              content: '';
              position: absolute;
              bottom: -16px;
              left: 50%;
              transform: translateX(-50%);
              width: 80px;
              height: 4px;
              background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
              border-radius: 2px;
          }
          
          .features-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              gap: 32px;
          }
          
          .feature-item {
              text-align: center;
              padding: 24px;
              border-radius: 12px;
              background: #f8fafc;
              transition: all 0.3s ease;
              border: 1px solid rgba(0, 0, 0, 0.03);
          }
          
          .feature-item:hover {
              transform: translateY(-4px);
              background: white;
              box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          }
          
          .feature-icon {
              font-size: 2.5rem;
              margin-bottom: 16px;
              display: block;
          }
          
          .feature-item h3 {
              font-size: 1.25rem;
              font-weight: 600;
              color: #1e3a8a;
              margin: 0 0 12px 0;
          }
          
          .feature-item p {
              color: #64748b;
              margin: 0;
              line-height: 1.6;
          }
          
          .footer {
              text-align: center;
              padding: 40px 0;
              color: #94a3b8;
              font-size: 0.95rem;
          }
          
          /* 响应式设?*/
          @media (max-width: 768px) {
              .main-container {
                  padding: 20px 15px;
              }
              
              .hero-section {
                  padding: 40px 24px;
              }
              
              h1 {
                  font-size: 2.25rem;
              }
              
              .nav-cards {
                  grid-template-columns: 1fr;
                  gap: 16px;
              }
              
              .nav-card {
                  padding: 24px;
              }
              
              .features-section {
                  padding: 32px 24px;
              }
              
              .features-grid {
                  grid-template-columns: 1fr;
                  gap: 20px;
              }
          }
          
          @media (max-width: 480px) {
              h1 {
                  font-size: 1.875rem;
              }
              
              .subtitle {
                  font-size: 1.1rem;
              }
              
              .description {
                  font-size: 1rem;
              }
              
              .nav-card {
                  padding: 20px;
              }
              
              .features-title {
                  font-size: 2rem;
              }
          }
      </style>
  </head>
  <body>
      <div class="main-container">
          <div class="hero-section">
              <div class="logo">🌟</div>
              <h1>公益API</h1>
              <div class="subtitle">免费 OpenAI 兼容接口服务</div>
              <p class="description">提供免费?GLM-4.5 模型访问服务，完全兼?OpenAI 接口标准，为开发者和研究者提供便捷的AI能力接入?/p>
              </div>
              
          <div class="nav-cards">
              <div class="nav-card">
                  <div class="nav-card-icon">🤖</div>
                  <h3>可用模型</h3>
                  <p>查看当前可用?AI 模型列表，了解每个模型的特性和适用场景?/p>
                  <a href="/v1/models" class="nav-card-btn">查看模型</a>
              </div>
          </div>
          
          <div class="features-section">
              <h2 class="features-title">核心特?/h2>
              <div class="features-grid">
                  <div class="feature-item">
                      <span class="feature-icon">🔄</span>
                      <h3>OpenAI 完全兼容</h3>
                      <p>100% 兼容 OpenAI API 标准，无需修改现有代码即可无缝迁移</p>
                  </div>
                  
                  <div class="feature-item">
                      <span class="feature-icon">?/span>
                      <h3>高性能流式响应</h3>
                      <p>支持实时流式输出，提供流畅的用户体验和更快的响应速度</p>
                  </div>
                  
                  <div class="feature-item">
                      <span class="feature-icon">🔐</span>
                      <h3>企业级安?/h3>
                      <p>完善的身份验证机制和访问控制，确保数据安全和服务稳定</p>
                  </div>
                  
                  <div class="feature-item">
                      <span class="feature-icon">🛠?/span>
                      <h3>灵活配置管理</h3>
                      <p>通过环境变量轻松配置服务参数，支持多种部署场?/p>
                  </div>
                  
                  <div class="feature-item">
                      <span class="feature-icon">🧠</span>
                      <h3>智能思维展示</h3>
                      <p>可视化展示模型推理过程，帮助理解AI决策逻辑</p>
                  </div>
                  
                  <div class="feature-item">
                      <span class="feature-icon">📈</span>
                      <h3>专业监控面板</h3>
                      <p>实时统计分析和可视化图表，全面掌握服务运行状?/p>
                  </div>
              </div>
          </div>
          
          <div class="footer">
              <p>© <a href="https://www.nodeloc.com/u/pastking" target="_blank" style="color: #64748b; text-decoration: none;">@https://www.nodeloc.com/u/pastking</a></p>
          </div>
      </div>
  </body>
  </html>`;
  }
  
  async function handleIndex(request: Request): Promise<Response> {
    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }
    
    return new Response(getIndexHTML(), {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8"
      }
    });
  }
  
  async function handleOptions(request: Request): Promise<Response> {
    const headers = new Headers();
    setCORSHeaders(headers);
    
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 200, headers });
    }
    
    return new Response("Not Found", { status: 404, headers });
  }
  
  async function handleModels(request: Request): Promise<Response> {
    const headers = new Headers();
    setCORSHeaders(headers);
    
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 200, headers });
    }
    
    // 支持的模?
    const models = SUPPORTED_MODELS.map(model => ({
      id: model.name,
        object: "model",
        created: Math.floor(Date.now() / 1000),
        owned_by: "z.ai"
    }));
    
    const response: ModelsResponse = {
      object: "list",
      data: models
    };
    
    headers.set("Content-Type", "application/json");
    return new Response(JSON.stringify(response), {
      status: 200,
      headers
    });
  }
  
  async function handleChatCompletions(request: Request): Promise<Response> {
    const startTime = Date.now();
    const url = new URL(request.url);
    const path = url.pathname;
    const userAgent = request.headers.get("User-Agent") || "";
    
    debugLog("收到chat completions请求");
    debugLog("🌐 User-Agent: %s", userAgent);
    
    // Cherry Studio 检?
    const isCherryStudio = userAgent.toLowerCase().includes('cherry') || userAgent.toLowerCase().includes('studio');
    if (isCherryStudio) {
      debugLog("🍒 检测到 Cherry Studio 客户端版? %s", 
        userAgent.match(/CherryStudio\/([^\s]+)/)?.[1] || 'unknown');
    }
    
    const headers = new Headers();
    setCORSHeaders(headers);
    
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 200, headers });
    }
    
    // 验证API Key
    const authHeader = request.headers.get("Authorization");
    if (!validateApiKey(authHeader)) {
      debugLog("缺少或无效的Authorization头");
      const duration = Date.now() - startTime;
      recordRequestStats(startTime, path, 401);
      addLiveRequest(request.method, path, 401, duration, userAgent);
      return new Response("Missing or invalid Authorization header", { 
        status: 401,
        headers 
      });
    }
    
    debugLog("API key验证通过");
    
    // 读取请求?
    let body: string;
    try {
      body = await request.text();
      debugLog("📥 收到请求体长? %d 字符", body.length);
      
      // 为Cherry Studio调试：记录原始请求体（截取前1000字符避免日志过长?
      const bodyPreview = body.length > 1000 ? body.substring(0, 1000) + "..." : body;
      debugLog("📄 请求体预? %s", bodyPreview);
    } catch (error) {
      debugLog("读取请求体失? %v", error);
      const duration = Date.now() - startTime;
      recordRequestStats(startTime, path, 400);
      addLiveRequest(request.method, path, 400, duration, userAgent);
      return new Response("Failed to read request body", { 
        status: 400,
        headers 
      });
    }
    
    // 解析请求
    let req: OpenAIRequest;
    try {
      req = JSON.parse(body) as OpenAIRequest;
      debugLog("?JSON解析成功");
    } catch (error) {
      debugLog("JSON解析失败: %v", error);
      const duration = Date.now() - startTime;
      recordRequestStats(startTime, path, 400);
      addLiveRequest(request.method, path, 400, duration, userAgent);
      return new Response("Invalid JSON", { 
        status: 400,
        headers 
      });
    }
    
    // 如果客户端没有明确指定stream参数，使用默认?
    if (!body.includes('"stream"')) {
      req.stream = DEFAULT_STREAM;
      debugLog("客户端未指定stream参数，使用默认? %v", DEFAULT_STREAM);
    }
    
    // 获取模型配置
    const modelConfig = getModelConfig(req.model);
    debugLog("请求解析成功 - 模型: %s (%s), 流式: %v, 消息? %d", req.model, modelConfig.name, req.stream, req.messages.length);
    
    // Cherry Studio 调试：详细检查每条消?
    debugLog("🔍 Cherry Studio 调试 - 检查原始消?");
    for (let i = 0; i < req.messages.length; i++) {
      const msg = req.messages[i];
      debugLog("  消息[%d] role: %s", i, msg.role);
      
      if (typeof msg.content === 'string') {
        debugLog("  消息[%d] content: 字符串类? 长度: %d", i, msg.content.length);
        if (msg.content.length === 0) {
          debugLog("  ⚠️  消息[%d] 内容为空字符?", i);
        } else {
          debugLog("  消息[%d] 内容预览: %s", i, msg.content.substring(0, 100));
        }
      } else if (Array.isArray(msg.content)) {
        debugLog("  消息[%d] content: 数组类型, 块数: %d", i, msg.content.length);
        for (let j = 0; j < msg.content.length; j++) {
          const block = msg.content[j];
          debugLog("    块[%d] type: %s", j, block.type);
          if (block.type === 'text' && block.text) {
            debugLog("    块[%d] text: %s", j, block.text.substring(0, 50));
          } else if (block.type === 'image_url' && block.image_url?.url) {
            debugLog("    块[%d] image_url: %s格式, 长度: %d", j, 
              block.image_url.url.startsWith('data:') ? 'base64' : 'url', 
              block.image_url.url.length);
          }
        }
      } else {
        debugLog("  ⚠️  消息[%d] content 类型异常: %s", i, typeof msg.content);
      }
    }
    
    // 处理和验证消息（特别是多模态内容）
    const processedMessages = processMessages(req.messages, modelConfig);
    debugLog("消息处理完成，处理后消息? %d", processedMessages.length);
    
    // 检查是否包含多模态内?
    const hasMultimodal = processedMessages.some(msg => 
      Array.isArray(msg.content) && 
      msg.content.some(block => 
        ['image_url', 'video_url', 'document_url', 'audio_url'].includes(block.type)
      )
    );
    
    if (hasMultimodal) {
      debugLog("🎯 检测到全方位多模态请求，模型: %s", modelConfig.name);
      if (!modelConfig.capabilities.vision) {
        debugLog("❌严重错误: 模型不支持多模态，但收到了多媒体内容！");
        debugLog("💡 Cherry Studio用户请检查: 确认选择了'glm-4.5v' 而不是'GLM-4.5'");
        debugLog("🔧 模型映射状态: %s → %s (vision: %s)", 
          req.model, modelConfig.upstreamId, modelConfig.capabilities.vision);
      } else {
        debugLog("✨GLM-4.5V支持全方位多模态理解：图像、视频、文档、音频");
        
        // 检查是否使用匿名token（多模态功能的重要限制）
        if (!ZAI_TOKEN || ZAI_TOKEN.trim() === "") {
          debugLog("⚠️ 重要警告: 正在使用匿名token处理多模态请求");
          debugLog("💡 Z.ai的匿名token可能不支持图像/视频/文档处理");
          debugLog("🔧 解决方案: 设置 ZAI_TOKEN 环境变量为正式的API Token");
          debugLog("📋 如果请求失败，这很可能是token权限问题");
        } else {
          debugLog("✅使用正式API Token，支持完整多模态功能");
        }
      }
    } else if (modelConfig.capabilities.vision && modelConfig.id === 'glm-4.5v') {
      debugLog("ℹ️ 使用GLM-4.5V模型但未检测到多媒体数据，仅处理文本内容");
    }
    
    // 生成会话相关ID
    const chatID = `${Date.now()}-${Math.floor(Date.now() / 1000)}`;
    const msgID = Date.now().toString();
    
    // 构造上游请?
    const upstreamReq: UpstreamRequest = {
      stream: true, // 总是使用流式从上游获?
      chat_id: chatID,
      id: msgID,
      model: modelConfig.upstreamId,
      messages: processedMessages,
      params: modelConfig.defaultParams,
      features: {
        enable_thinking: modelConfig.capabilities.thinking,
        image_generation: false,
        web_search: false,
        auto_web_search: false,
        preview_mode: modelConfig.capabilities.vision
      },
      background_tasks: {
        title_generation: false,
        tags_generation: false
      },
      mcp_servers: modelConfig.capabilities.mcp ? [] : undefined,
      model_item: {
        id: modelConfig.upstreamId,
        name: modelConfig.name,
        owned_by: "openai",
        openai: {
          id: modelConfig.upstreamId,
          name: modelConfig.upstreamId,
          owned_by: "openai",
          openai: {
            id: modelConfig.upstreamId
          },
          urlIdx: 1
        },
        urlIdx: 1,
        info: {
          id: modelConfig.upstreamId,
          user_id: "api-user",
          base_model_id: null,
          name: modelConfig.name,
          params: modelConfig.defaultParams,
          meta: {
            profile_image_url: "/static/favicon.png",
            description: modelConfig.capabilities.vision ? "Advanced visual understanding and analysis" : "Most advanced model, proficient in coding and tool use",
            capabilities: {
              vision: modelConfig.capabilities.vision,
              citations: false,
              preview_mode: modelConfig.capabilities.vision,
              web_search: false,
              language_detection: false,
              restore_n_source: false,
              mcp: modelConfig.capabilities.mcp,
              file_qa: modelConfig.capabilities.mcp,
              returnFc: true,
              returnThink: modelConfig.capabilities.thinking,
              think: modelConfig.capabilities.thinking
            }
          }
        }
      },
      tool_servers: [],
      variables: {
        "{{USER_NAME}}": `Guest-${Date.now()}`,
        "{{USER_LOCATION}}": "Unknown",
        "{{CURRENT_DATETIME}}": new Date().toLocaleString('zh-CN'),
        "{{CURRENT_DATE}}": new Date().toLocaleDateString('zh-CN'),
        "{{CURRENT_TIME}}": new Date().toLocaleTimeString('zh-CN'),
        "{{CURRENT_WEEKDAY}}": new Date().toLocaleDateString('zh-CN', { weekday: 'long' }),
        "{{CURRENT_TIMEZONE}}": "Asia/Shanghai",
        "{{USER_LANGUAGE}}": "zh-CN"
      }
    };
    
    // 选择本次对话使用的token
    let authToken = ZAI_TOKEN;
    if (ANON_TOKEN_ENABLED) {
      try {
        const anonToken = await getAnonymousToken();
        authToken = anonToken;
        debugLog("匿名token获取成功: %s...", anonToken.substring(0, 10));
      } catch (error) {
        debugLog("匿名token获取失败，回退固定token: %v", error);
      }
    }
    
    // 调用上游API
    try {
      if (req.stream) {
        return await handleStreamResponse(upstreamReq, chatID, authToken, startTime, path, userAgent, req, modelConfig);
      } else {
        return await handleNonStreamResponse(upstreamReq, chatID, authToken, startTime, path, userAgent, req, modelConfig);
      }
    } catch (error) {
      debugLog("调用上游失败: %v", error);
      const duration = Date.now() - startTime;
      recordRequestStats(startTime, path, 502);
      addLiveRequest(request.method, path, 502, duration, userAgent);
      return new Response("Failed to call upstream", { 
        status: 502,
        headers 
      });
    }
  }
  
  async function handleStreamResponse(
    upstreamReq: UpstreamRequest, 
    chatID: string, 
    authToken: string,
    startTime: number,
    path: string,
    userAgent: string,
    req: OpenAIRequest,
    modelConfig: ModelConfig
  ): Promise<Response> {
    debugLog("开始处理流式响?(chat_id=%s)", chatID);
    
    try {
      const response = await callUpstreamWithHeaders(upstreamReq, chatID, authToken);
      
      if (!response.ok) {
        debugLog("上游返回错误状? %d", response.status);
        const duration = Date.now() - startTime;
        recordRequestStats(startTime, path, 502);
        addLiveRequest("POST", path, 502, duration, userAgent);
        return new Response("Upstream error", { status: 502 });
      }
      
      if (!response.body) {
        debugLog("上游响应体为空");
        const duration = Date.now() - startTime;
        recordRequestStats(startTime, path, 502);
        addLiveRequest("POST", path, 502, duration, userAgent);
        return new Response("Upstream response body is empty", { status: 502 });
      }
      
      // 创建可读流
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();
      
      // 发送第一个chunk（role?
      const firstChunk: OpenAIResponse = {
        id: `chatcmpl-${Date.now()}`,
        object: "chat.completion.chunk",
        created: Math.floor(Date.now() / 1000),
        model: req.model,
        choices: [
          {
            index: 0,
            delta: { role: "assistant" }
          }
        ]
      };
      
      // 写入第一个chunk
      writer.write(encoder.encode(`data: ${JSON.stringify(firstChunk)}\n\n`));
      
      // 处理上游SSE?
      processUpstreamStream(response.body, writer, encoder, req.model).catch(error => {
        debugLog("处理上游流时出错: %v", error);
      });
      
      // 记录成功请求统计
      const duration = Date.now() - startTime;
      recordRequestStats(startTime, path, 200);
      addLiveRequest("POST", path, 200, duration, userAgent, modelConfig.name);
      
      return new Response(readable, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": "true"
        }
      });
    } catch (error) {
      debugLog("处理流式响应时出? %v", error);
      const duration = Date.now() - startTime;
      recordRequestStats(startTime, path, 502);
      addLiveRequest("POST", path, 502, duration, userAgent);
      return new Response("Failed to process stream response", { status: 502 });
    }
  }
  
  async function handleNonStreamResponse(
    upstreamReq: UpstreamRequest, 
    chatID: string, 
    authToken: string,
    startTime: number,
    path: string,
    userAgent: string,
    req: OpenAIRequest,
    modelConfig: ModelConfig
  ): Promise<Response> {
    debugLog("开始处理非流式响应 (chat_id=%s)", chatID);
    
    try {
      const response = await callUpstreamWithHeaders(upstreamReq, chatID, authToken);
      
      if (!response.ok) {
        debugLog("上游返回错误状? %d", response.status);
        const duration = Date.now() - startTime;
        recordRequestStats(startTime, path, 502);
        addLiveRequest("POST", path, 502, duration, userAgent);
        return new Response("Upstream error", { status: 502 });
      }
      
      if (!response.body) {
        debugLog("上游响应体为空");
        const duration = Date.now() - startTime;
        recordRequestStats(startTime, path, 502);
        addLiveRequest("POST", path, 502, duration, userAgent);
        return new Response("Upstream response body is empty", { status: 502 });
      }
      
      // 收集完整响应
      const finalContent = await collectFullResponse(response.body);
      debugLog("内容收集完成，最终长? %d", finalContent.length);
      
      // 构造完整响?
      const openAIResponse: OpenAIResponse = {
        id: `chatcmpl-${Date.now()}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: req.model,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: finalContent
            },
            finish_reason: "stop"
          }
        ],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };
      
      // 记录成功请求统计
      const duration = Date.now() - startTime;
      recordRequestStats(startTime, path, 200);
      addLiveRequest("POST", path, 200, duration, userAgent, modelConfig.name);
      
      return new Response(JSON.stringify(openAIResponse), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": "true"
        }
      });
    } catch (error) {
      debugLog("处理非流式响应时出错: %v", error);
      const duration = Date.now() - startTime;
      recordRequestStats(startTime, path, 502);
      addLiveRequest("POST", path, 502, duration, userAgent);
      return new Response("Failed to process non-stream response", { status: 502 });
    }
  }
  
  // Dashboard和文档功能已移除

  // 主HTTP服务?
  async function main() {
  console.log(`OpenAI兼容API服务器启动`);
  console.log(`支持的模? ${SUPPORTED_MODELS.map(m => `${m.id} (${m.name})`).join(', ')}`);
  console.log(`上游: ${UPSTREAM_URL}`);
  console.log(`Debug模式: ${DEBUG_MODE}`);
  console.log(`默认流式响应: ${DEFAULT_STREAM}`);
  console.log(`Dashboard启用: ${DASHBOARD_ENABLED}`);

  // 检测是否在Deno Deploy上运行
  const isDenoDeploy = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;
  
  if (isDenoDeploy) {
    // Deno Deploy环境
    console.log("运行在Deno Deploy环境中");
    Deno.serve(handleRequest);
  } else {
    // 本地或自托管环境
    const port = parseInt(Deno.env.get("PORT") || "9090");
    console.log(`运行在本地环境中，端口: ${port}`);
    
    const server = Deno.listen({ port });
    
    for await (const conn of server) {
      handleHttp(conn);
    }
  }
}

// 处理HTTP连接（用于本地环境）
async function handleHttp(conn: Deno.Conn) {
  const httpConn = Deno.serveHttp(conn);
  
  while (true) {
    const requestEvent = await httpConn.nextRequest();
    if (!requestEvent) break;
    
    const { request, respondWith } = requestEvent;
    const url = new URL(request.url);
    const startTime = Date.now();
    const userAgent = request.headers.get("User-Agent") || "";

try {
  // 路由分发
  if (url.pathname === "/") {
    const response = await handleIndex(request);
    await respondWith(response);
    recordRequestStats(startTime, url.pathname, response.status);
    addLiveRequest(request.method, url.pathname, response.status, Date.now() - startTime, userAgent);
  } else if (url.pathname === "/v1/models") {
    const response = await handleModels(request);
    await respondWith(response);
    recordRequestStats(startTime, url.pathname, response.status);
    addLiveRequest(request.method, url.pathname, response.status, Date.now() - startTime, userAgent);
  } else if (url.pathname === "/v1/chat/completions") {
    const response = await handleChatCompletions(request);
    await respondWith(response);
    // 请求统计已在handleChatCompletions中记?
  } else {
    const response = await handleOptions(request);
    await respondWith(response);
    recordRequestStats(startTime, url.pathname, response.status);
    addLiveRequest(request.method, url.pathname, response.status, Date.now() - startTime, userAgent);
  }
} catch (error) {
  debugLog("处理请求时出? %v", error);
  const response = new Response("Internal Server Error", { status: 500 });
  await respondWith(response);
  recordRequestStats(startTime, url.pathname, 500);
  addLiveRequest(request.method, url.pathname, 500, Date.now() - startTime, userAgent);
}
}
}

// 处理HTTP请求（用于Deno Deploy环境?
async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const startTime = Date.now();
  const userAgent = request.headers.get("User-Agent") || "";

  try {
    // 路由分发
    if (url.pathname === "/") {
      const response = await handleIndex(request);
      recordRequestStats(startTime, url.pathname, response.status);
      addLiveRequest(request.method, url.pathname, response.status, Date.now() - startTime, userAgent);
      return response;
    } else if (url.pathname === "/v1/models") {
      const response = await handleModels(request);
      recordRequestStats(startTime, url.pathname, response.status);
      addLiveRequest(request.method, url.pathname, response.status, Date.now() - startTime, userAgent);
      return response;
    } else if (url.pathname === "/v1/chat/completions") {
      const response = await handleChatCompletions(request);
      // 请求统计已在handleChatCompletions中记?
      return response;
    } else {
      const response = await handleOptions(request);
      recordRequestStats(startTime, url.pathname, response.status);
      addLiveRequest(request.method, url.pathname, response.status, Date.now() - startTime, userAgent);
      return response;
    }
  } catch (error) {
    debugLog("处理请求时出? %v", error);
    recordRequestStats(startTime, url.pathname, 500);
    addLiveRequest(request.method, url.pathname, 500, Date.now() - startTime, userAgent);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// 启动服务器
main();
