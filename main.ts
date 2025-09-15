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
   * 
   * 
   */
  interface RequestStats {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    lastRequestTime: Date;
    averageResponseTime: number;
  }
  
  /**
   * 
   * 
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
   * OpenAI
   * 
   */
  interface OpenAIRequest {
    model: string;
    messages: Message[];
    stream?: boolean;
    temperature?: number;
    max_tokens?: number;
  }
  
  /**
   * 
   * 
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
   * 
   * ���η��������ṹ
   * ��Z.ai�������͵�������ʽ
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
   * OpenAI
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
   * 
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
   * 
   */
  
  // ˼�����ݴ�������: strip-ȥ��<details>��ǩ, think-תΪ<thinking>��ǩ, raw-����ԭ��
  const THINK_TAGS_MODE = "strip";
  
  // αװǰ��ͷ��������ץ��������
  const X_FE_VERSION = "prod-fe-1.0.70";
  const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0";
  const SEC_CH_UA = "\"Not;A=Brand\";v=\"99\", \"Microsoft Edge\";v=\"139\", \"Chromium\";v=\"139\"";
  const SEC_CH_UA_MOB = "?0";
  const SEC_CH_UA_PLAT = "\"Windows\"";
  const ORIGIN_BASE = "https://chat.z.ai";
  
  const ANON_TOKEN_ENABLED = true;
  
  /**
   * ������������
   */
  const UPSTREAM_URL = Deno.env.get("UPSTREAM_URL") || "https://chat.z.ai/api/chat/completions";
  const DEFAULT_KEY = Deno.env.get("DEFAULT_KEY") || "sk-your-key";
  const ZAI_TOKEN = Deno.env.get("ZAI_TOKEN") || "";
  
  /**
   * ֧�ֵ�ģ������
   */
  interface ModelConfig {
    id: string;           // OpenAI API�е�ģ��ID
    name: string;         // ��ʾ����
    upstreamId: string;   // Z.ai���η����е�ģ��ID
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
  
  // 
  const DEFAULT_MODEL = SUPPORTED_MODELS[0];
  
  // 
  function getModelConfig(modelId: string): ModelConfig {
    // �淶��ģ��ID���������ã�Cherry Studio�ȿͻ��˿���ʹ�ò�ͬ��ID��ʽ
    const normalizedModelId = normalizeModelId(modelId);
    const found = SUPPORTED_MODELS.find(m => m.id === normalizedModelId);
    
    if (!found) {
(`δ֪ģ�� ${modelId} (�淶����: ${normalizedModelId})��ʹ��Ĭ��ģ�� ${DEFAULT_MODEL.name}`);
    }
    
    return found || DEFAULT_MODEL;
  }
  
  /**
   * Cherry Studio�ȿͻ��˵�ģ��ID�淶������
   */
  function normalizeModelId(modelId: string): string {
    const normalized = modelId.toLowerCase().trim();
    
    // ģ��IDӳ����
    const modelMappings: Record<string, string> = {
      'glm-4.5v': 'glm-4.5v',
      'glm4.5v': 'glm-4.5v',
      'glm_4.5v': 'glm-4.5v',
      'gpt-4-vision-preview': 'glm-4.5v',  // 
      '0727-360b-api': '0727-360B-API',
      'glm-4.5': '0727-360B-API',
      'glm4.5': '0727-360B-API',
      'glm_4.5': '0727-360B-API',
      'gpt-4': '0727-360B-API'  // 
    };
    
    const mapped = modelMappings[normalized];
    if (mapped) {
(`ģ��ӳ��: ${normalized} -> ${mapped}`);
      return mapped;
    }
    
    return normalized;
  }
  
  /**
   * 
   * 
   */
  function processMessages(messages: Message[], modelConfig: ModelConfig): Message[] {
    const processedMessages: Message[] = [];
    
    for (const message of messages) {
      const processedMessage: Message = { ...message };
      
      // �����Ƿ�Ϊ�Ӿ�ģ��
      if (Array.isArray(message.content)) {
("������ý����Ϣ����");
        
        // ͳ��ý������
        const mediaStats = {
          text: 0,
          images: 0,
          videos: 0,
          documents: 0,
          audios: 0,
          others: 0
        };
        
        // �����Ƿ�Ϊ�Ӿ�ģ��
        if (!modelConfig.capabilities.vision) {
("ģ�Ͳ�֧���Ӿ����ܣ�ת��Ϊ�ı�����");
          // ��ȡ�ı�����
          const textContent = message.content
            .filter(block => block.type === 'text')
            .map(block => block.text)
            .join('\n');
          processedMessage.content = textContent;
        } else {
          // GLM-4.5V 
          for (const block of message.content) {
            switch (block.type) {
              case 'text':
                if (block.text) {
                  mediaStats.text++;
(`�����ı�����: ${block.text.substring(0, 50)}...`);
                }
                break;
                
              case 'image_url':
                if (block.image_url?.url) {
                  mediaStats.images++;
                  const url = block.image_url.url;
                  if (url.startsWith('data:image/')) {
                    const mimeMatch = url.match(/data:image\/([^;]+)/);
                    const format = mimeMatch ? mimeMatch[1] : 'unknown';
(`����Base64ͼƬ����ʽ: ${format}`);
                  } else if (url.startsWith('http')) {
(`��������ͼƬ: ${url.substring(0, 50)}...`);
                  } else {
(`����������ʽͼƬ: ${url.substring(0, 30)}...`);
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
(`����Base64��Ƶ����ʽ: ${format}`);
                  } else if (url.startsWith('http')) {
(`����������Ƶ: ${url.substring(0, 50)}...`);
                  } else {
(`����������ʽ��Ƶ: ${url.substring(0, 30)}...`);
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
(`����Base64�ĵ�����ʽ: ${format}`);
                  } else if (url.startsWith('http')) {
(`���������ĵ�: ${url.substring(0, 50)}...`);
                  } else {
(`����������ʽ�ĵ�: ${url.substring(0, 30)}...`);
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
(`����Base64��Ƶ����ʽ: ${format}`);
                  } else if (url.startsWith('http')) {
(`����������Ƶ: ${url.substring(0, 50)}...`);
                  } else {
(`����������ʽ��Ƶ: ${url.substring(0, 30)}...`);
                  }
                }
                break;
                
              default:
                mediaStats.others++;
            }
          }
          
          // ����������
          const totalMedia = mediaStats.images + mediaStats.videos + mediaStats.documents + mediaStats.audios;
          if (totalMedia > 0) {
          }
        }
      } else if (typeof message.content === 'string') {
      }
      
      processedMessages.push(processedMessage);
    }
    
    return processedMessages;
  }
  
  const DEBUG_MODE = Deno.env.get("DEBUG_MODE") !== "false"; // 
  const DEFAULT_STREAM = Deno.env.get("DEFAULT_STREAM") !== "false"; // 
  const DASHBOARD_ENABLED = Deno.env.get("DASHBOARD_ENABLED") !== "false"; // 
  
  /**
   * 
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
   * 
   */
  
  // function debugLog(format: string, ...args: unknown[]): void {
  //   if (DEBUG_MODE) {
  //     console.log(`[DEBUG] ${format}`, ...args);
  //   }
  // }
  
  function recordRequestStats(startTime: number, path: string, status: number): void {
    const duration = Date.now() - startTime;
    
    stats.totalRequests++;
    stats.lastRequestTime = new Date();
    
    if (status >= 200 && status < 300) {
      stats.successfulRequests++;
    } else {
      stats.failedRequests++;
    }
    
    // �����Ƿ�Ϊ�Ӿ�ģ��
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
    
    // ����������?100
    if (liveRequests.length > 100) {
      liveRequests = liveRequests.slice(1);
    }
  }
  
  function getLiveRequestsData(): string {
    try {
      // 
      if (!Array.isArray(liveRequests)) {
("liveRequests���ݸ�ʽ����������Ϊ������");
        liveRequests = [];
      }
      
      // ����������
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
      return JSON.stringify([]);
    }
  }
  
  function getStatsData(): string {
    try {
      // 
      if (!stats) {
("stats���ݲ����ڣ�ʹ��Ĭ��ֵ");
        stats = {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          lastRequestTime: new Date(),
          averageResponseTime: 0
        };
      }
      
      // ����������
      const statsData = {
        totalRequests: stats.totalRequests || 0,
        successfulRequests: stats.successfulRequests || 0,
        failedRequests: stats.failedRequests || 0,
        averageResponseTime: stats.averageResponseTime || 0
      };
      
      return JSON.stringify(statsData);
    } catch (error) {
(`��������ʱ����: ${error}`);
      return JSON.stringify({
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0
      });
    }
  }
  
  function getClientIP(request: Request): string {
    // 
    const xff = request.headers.get("X-Forwarded-For");
    if (xff) {
      const ips = xff.split(",");
      if (ips.length > 0) {
        return ips[0].trim();
      }
    }
    
    // 
    const xri = request.headers.get("X-Real-IP");
    if (xri) {
      return xri;
    }
    
    // 
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
      throw error;
    }
  }
  
  // 
  async function callUpstreamWithHeaders(
    upstreamReq: UpstreamRequest, 
    refererChatID: string, 
    authToken: string
  ): Promise<Response> {
    try {
      
      // ����������
      const hasMultimedia = upstreamReq.messages.some(msg => 
        Array.isArray(msg.content) && 
        msg.content.some(block => 
          ['image_url', 'video_url', 'document_url', 'audio_url'].includes(block.type)
        )
      );
      
      if (hasMultimedia) {
        
        for (let i = 0; i < upstreamReq.messages.length; i++) {
          const msg = upstreamReq.messages[i];
          if (Array.isArray(msg.content)) {
            for (let j = 0; j < msg.content.length; j++) {
              const block = msg.content[j];
              
              // 
              if (block.type === 'image_url' && block.image_url?.url) {
                const url = block.image_url.url;
                if (url.startsWith('data:image/')) {
                  const mimeMatch = url.match(/data:image\/([^;]+)/);
                  const format = mimeMatch ? mimeMatch[1] : 'unknown';
                  const sizeKB = Math.round(url.length * 0.75 / 1024); // base64
                  
                  // 
                  if (sizeKB > 1000) {
                  } else if (sizeKB > 500) {
                  }
                } else {
                }
              }
              
              // 
              if (block.type === 'video_url' && block.video_url?.url) {
                const url = block.video_url.url;
                if (url.startsWith('data:video/')) {
                  const mimeMatch = url.match(/data:video\/([^;]+)/);
                  const format = mimeMatch ? mimeMatch[1] : 'unknown';
                } else {
                }
              }
              
              // 
              if (block.type === 'document_url' && block.document_url?.url) {
                const url = block.document_url.url;
                if (url.startsWith('data:application/')) {
                  const mimeMatch = url.match(/data:application\/([^;]+)/);
                  const format = mimeMatch ? mimeMatch[1] : 'unknown';
                } else {
                }
              }
              
              // 
              if (block.type === 'audio_url' && block.audio_url?.url) {
                const url = block.audio_url.url;
                if (url.startsWith('data:audio/')) {
                  const mimeMatch = url.match(/data:audio\/([^;]+)/);
                  const format = mimeMatch ? mimeMatch[1] : 'unknown';
                } else {
                }
              }
            }
          }
        }
      }
      
      
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
      
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  function transformThinking(content: string): string {
    // ?<summary>?/summary>
    let result = content.replace(/<summary>.*?<\/summary>/gs, "");
    // ����������
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
    
    // ���������� "> "
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
        buffer = lines.pop() || ""; // 
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.substring(6);
            if (dataStr === "") continue;
            
            
            try {
              const upstreamData = JSON.parse(dataStr) as UpstreamData;
              
              // 
              if (upstreamData.error || upstreamData.data.error || 
                  (upstreamData.data.inner && upstreamData.data.inner.error)) {
                const errObj = upstreamData.error || upstreamData.data.error || 
                             (upstreamData.data.inner && upstreamData.data.inner.error);
                
                // ����������
                const errorDetail = (errObj?.detail || "").toLowerCase();
                if (errorDetail.includes("something went wrong") || errorDetail.includes("try again later")) {
Z.ai 
     1. 
     2. 
     3. 
     4. 
                }
                
                // 
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
              
              
              // 
              if (upstreamData.data.delta_content && upstreamData.data.delta_content !== "") {
                let out = upstreamData.data.delta_content;
                if (upstreamData.data.phase === "thinking") {
                  out = transformThinking(out);
                }
                
                if (out !== "") {
                  
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
              
              // �����Ƿ�Ϊ�Ӿ�ģ��
              if (upstreamData.data.done || upstreamData.data.phase === "done") {
                
                // 
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
SSE
            }
          }
        }
      }
    } finally {
      writer.close();
    }
  }
  
  // ����������
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
        buffer = lines.pop() || ""; // 
        
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
              
              // �����Ƿ�Ϊ�Ӿ�ģ��
              if (upstreamData.data.done || upstreamData.data.phase === "done") {
                return fullContent;
              }
            } catch (error) {
              // ����������
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
    
    return fullContent;
  }
  
  async function handleIndex(request: Request): Promise<Response> {
    return new Response(JSON.stringify({
      msg: "接口来自PastKing公益API - NodeLoc"
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  async function handleOptions(request: Request): Promise<Response> {
    const headers = new Headers();
    setCORSHeaders(headers);
    return new Response(null, { status: 204, headers });
  }

  async function handleModels(request: Request): Promise<Response> {
    const models = SUPPORTED_MODELS.map(model => ({
      id: model.id,
      object: "model",
      created: Math.floor(Date.now() / 1000),
      owned_by: "pastking-api"
    }));

    const response = new Response(JSON.stringify({
      object: "list",
      data: models
    }), {
      headers: { "Content-Type": "application/json" }
    });
    
    setCORSHeaders(response.headers);
    return response;
  }

  async function handleChatCompletions(request: Request): Promise<Response> {
    const startTime = Date.now();
    
    try {
      if (request.method !== 'POST') {
        return new Response("Method not allowed", { status: 405 });
      }
      
      const authHeader = request.headers.get("Authorization");
      if (!validateApiKey(authHeader)) {
        const duration = Date.now() - startTime;
        recordRequestStats(startTime, "/v1/chat/completions", 401);
        return new Response(JSON.stringify({
          error: {
            message: "Invalid API key",
            type: "invalid_request_error",
            code: "invalid_api_key"
          }
        }), { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      const body = await request.text();
      let req: any;
      try {
        req = JSON.parse(body);
      } catch (error) {
        const duration = Date.now() - startTime;
        recordRequestStats(startTime, "/v1/chat/completions", 400);
        return new Response(JSON.stringify({
          error: {
            message: "Invalid JSON",
            type: "invalid_request_error"
          }
        }), { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      const modelConfig = getModelConfig(req.model || "gpt-3.5-turbo");
      const processedMessages = processMessages(req.messages || [], modelConfig);
      
      if (req.stream) {
        return await handleStreamResponse(request, req, processedMessages, modelConfig, startTime);
      } else {
        return await handleNonStreamResponse(request, req, processedMessages, modelConfig, startTime);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      recordRequestStats(startTime, "/v1/chat/completions", 500);
      return new Response(JSON.stringify({
        error: {
          message: "Internal server error",
          type: "server_error"
        }
      }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  async function handleStreamResponse(
    request: Request,
    req: any,
    processedMessages: any[],
    modelConfig: any,
    startTime: number
  ): Promise<Response> {
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(`data: {"error": {"message": "Stream not implemented", "type": "not_implemented"}}\n\n`));
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
      }
    });

    return new Response(body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });
  }

  async function handleNonStreamResponse(
    request: Request,
    req: any,
    processedMessages: any[],
    modelConfig: any,
    startTime: number
  ): Promise<Response> {
    return new Response(JSON.stringify({
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: req.model || "gpt-3.5-turbo",
      choices: [{
        index: 0,
        message: {
          role: "assistant",
          content: "抱歉，当前服务暂时不可用。请稍后再试。"
        },
        finish_reason: "stop"
      }],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30
      }
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // 处理HTTP请求
  async function handleHttp(request: Request): Promise<Response> {
    const startTime = Date.now();
    const url = new URL(request.url);
    const userAgent = request.headers.get("User-Agent") || "Unknown";
    
    try {
      if (request.method === "OPTIONS") {
        const response = await handleOptions(request);
        recordRequestStats(startTime, url.pathname, response.status);
        addLiveRequest(request.method, url.pathname, response.status, Date.now() - startTime, userAgent);
        return response;
      }
      
      if (url.pathname === "/") {
        const response = await handleIndex(request);
        recordRequestStats(startTime, url.pathname, response.status);
        addLiveRequest(request.method, url.pathname, response.status, Date.now() - startTime, userAgent);
        return response;
      }
      
      if (url.pathname === "/v1/models") {
        const response = await handleModels(request);
        recordRequestStats(startTime, url.pathname, response.status);
        addLiveRequest(request.method, url.pathname, response.status, Date.now() - startTime, userAgent);
        return response;
      }
      
      if (url.pathname === "/v1/chat/completions") {
        const response = await handleChatCompletions(request);
        recordRequestStats(startTime, url.pathname, response.status);
        addLiveRequest(request.method, url.pathname, response.status, Date.now() - startTime, userAgent);
        return response;
      }
      
      const response = new Response("Not Found", { status: 404 });
      recordRequestStats(startTime, url.pathname, response.status);
      addLiveRequest(request.method, url.pathname, response.status, Date.now() - startTime, userAgent);
      return response;
    } catch (error) {
      recordRequestStats(startTime, url.pathname, 500);
      addLiveRequest(request.method, url.pathname, 500, Date.now() - startTime, userAgent);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  // 处理请求
  async function handleRequest(request: Request): Promise<Response> {
    return await handleHttp(request);
  }

  // 启动服务器
  async function main(): Promise<void> {
    const port = parseInt(Deno.env.get("PORT") || "8000");
    
    console.log(`公益API服务启动在端口 ${port}`);
    console.log(`访问 http://localhost:${port} 查看主页`);
    console.log(`API端点: http://localhost:${port}/v1/chat/completions`);
    console.log(`模型列表: http://localhost:${port}/v1/models`);
    
    if (typeof Deno !== "undefined" && Deno.serve) {
      Deno.serve(handleHttp);
    } else {
      const server = Deno.listen({ port });
      console.log(`HTTP server running on :${port}`);
      
      for await (const conn of server) {
        (async () => {
          const httpConn = Deno.serveHttp(conn);
          for await (const requestEvent of httpConn) {
            const response = await handleRequest(requestEvent.request);
            requestEvent.respondWith(response);
          }
        })();
      }
    }
  }

  main();
