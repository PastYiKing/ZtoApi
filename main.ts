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
   * ����ͳ����Ϣ�ӿ�
   * ���ڸ���API���õĸ���ָ?
   */
  interface RequestStats {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    lastRequestTime: Date;
    averageResponseTime: number;
  }
  
  /**
   * ʵʱ������Ϣ�ӿ�
   * ����Dashboard��ʾ�����API�����¼
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
   * OpenAI��������ṹ
   * ��׼���������API�����ʽ
   */
  interface OpenAIRequest {
    model: string;
    messages: Message[];
    stream?: boolean;
    temperature?: number;
    max_tokens?: number;
  }
  
  /**
   * ������Ϣ�ṹ
   * ֧��ȫ��λ��ģ̬���ݣ��ı���ͼ����Ƶ����?
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
   * ���η�������ṹ
   * ��Z.ai�����͵������ʽ
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
   * OpenAI������Ӧ�ṹ
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
   * ����SSE���ݽṹ
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
   * ���ó�������
   */
  
  // ˼�����ݴ����? strip-ȥ��<details>��ǩ, think-תΪ<thinking>��ǩ, raw-����ԭ��
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
   * ֧�ֵ�ģ����?
   */
  interface ModelConfig {
    id: string;           // OpenAI API�е�ģ��ID
    name: string;         // ��ʾ����
    upstreamId: string;   // Z.ai���ε�ģ��ID
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
  
  // Ĭ��ģ��
  const DEFAULT_MODEL = SUPPORTED_MODELS[0];
  
  // ����ģ��ID��ȡ����
  function getModelConfig(modelId: string): ModelConfig {
    // ��׼��ģ��ID������Cherry Studio�ȿͻ��˵Ĵ�Сд����
    const normalizedModelId = normalizeModelId(modelId);
    const found = SUPPORTED_MODELS.find(m => m.id === normalizedModelId);
    
    if (!found) {
      debugLog("?? δ�ҵ�ģ����? %s (��׼����: %s)��ʹ��Ĭ��ģ? %s", 
        modelId, normalizedModelId, DEFAULT_MODEL.name);
    }
    
    return found || DEFAULT_MODEL;
  }
  
  /**
   * ��׼��ģ��ID�������ͬ�ͻ��˵�������?
   * Cherry Studio�ȿͻ��˿���ʹ�ò�ͬ�Ĵ�Сд��ʽ
   */
  function normalizeModelId(modelId: string): string {
    const normalized = modelId.toLowerCase().trim();
    
    // ���������ģ��IDӳ��
    const modelMappings: Record<string, string> = {
      'glm-4.5v': 'glm-4.5v',
      'glm4.5v': 'glm-4.5v',
      'glm_4.5v': 'glm-4.5v',
      'gpt-4-vision-preview': 'glm-4.5v',  // ������
      '0727-360b-api': '0727-360B-API',
      'glm-4.5': '0727-360B-API',
      'glm4.5': '0727-360B-API',
      'glm_4.5': '0727-360B-API',
      'gpt-4': '0727-360B-API'  // ������
    };
    
    const mapped = modelMappings[normalized];
    if (mapped) {
      debugLog("?? ģ��IDӳ��: %s ?%s", modelId, mapped);
      return mapped;
    }
    
    return normalized;
  }
  
  /**
   * �������֤ȫ��λ��ģ̬��?
   * ֧��ͼ����Ƶ���ĵ�����Ƶ�ȶ���ý������
   */
  function processMessages(messages: Message[], modelConfig: ModelConfig): Message[] {
    const processedMessages: Message[] = [];
    
    for (const message of messages) {
      const processedMessage: Message = { ...message };
      
      // ����Ƿ�Ϊ��ģ̬��?
      if (Array.isArray(message.content)) {
        debugLog("��⵽��ģ̬��Ϣ�����ݿ���? %d", message.content.length);
        
        // ͳ�Ƹ���ý������
        const mediaStats = {
          text: 0,
          images: 0,
          videos: 0,
          documents: 0,
          audios: 0,
          others: 0
        };
        
        // ��֤ģ���Ƿ�֧�ֶ�ģ̬
        if (!modelConfig.capabilities.vision) {
          debugLog("����: ģ�� %s ��֧�ֶ�ģ̬�����յ��˶�ģ̬��Ϣ", modelConfig.name);
          // ֻ�����ı�����
          const textContent = message.content
            .filter(block => block.type === 'text')
            .map(block => block.text)
            .join('\n');
          processedMessage.content = textContent;
        } else {
          // GLM-4.5V ֧��ȫ��λ��ģ̬����������������?
          for (const block of message.content) {
            switch (block.type) {
              case 'text':
                if (block.text) {
                  mediaStats.text++;
                  debugLog("?? �ı����ݣ���? %d", block.text.length);
                }
                break;
                
              case 'image_url':
                if (block.image_url?.url) {
                  mediaStats.images++;
                  const url = block.image_url.url;
                  if (url.startsWith('data:image/')) {
                    const mimeMatch = url.match(/data:image\/([^;]+)/);
                    const format = mimeMatch ? mimeMatch[1] : 'unknown';
                    debugLog("???ͼ������: %s��ʽ, ��С: %d�ַ�", format, url.length);
                  } else if (url.startsWith('http')) {
                    debugLog("?? ͼ��URL: %s", url);
                  } else {
                    debugLog("?? δ֪ͼ���ʽ: %s", url.substring(0, 50));
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
                    debugLog("?? ��Ƶ����: %s��ʽ, ��С: %d�ַ�", format, url.length);
                  } else if (url.startsWith('http')) {
                    debugLog("?? ��ƵURL: %s", url);
                  } else {
                    debugLog("?? δ֪��Ƶ��ʽ: %s", url.substring(0, 50));
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
                    debugLog("?? �ĵ�����: %s��ʽ, ��С: %d�ַ�", format, url.length);
                  } else if (url.startsWith('http')) {
                    debugLog("?? �ĵ�URL: %s", url);
                  } else {
                    debugLog("?? δ֪�ĵ���ʽ: %s", url.substring(0, 50));
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
                    debugLog("?? ��Ƶ����: %s��ʽ, ��С: %d�ַ�", format, url.length);
                  } else if (url.startsWith('http')) {
                    debugLog("?? ��ƵURL: %s", url);
                  } else {
                    debugLog("?? δ֪��Ƶ��ʽ: %s", url.substring(0, 50));
                  }
                }
                break;
                
              default:
                mediaStats.others++;
                debugLog("?δ֪��������: %s", block.type);
            }
          }
          
          // ���ͳ����Ϣ
          const totalMedia = mediaStats.images + mediaStats.videos + mediaStats.documents + mediaStats.audios;
          if (totalMedia > 0) {
            debugLog("?? ��ģ̬����ͳ? �ı�(%d) ͼ��(%d) ��Ƶ(%d) �ĵ�(%d) ��Ƶ(%d)", 
              mediaStats.text, mediaStats.images, mediaStats.videos, mediaStats.documents, mediaStats.audios);
          }
        }
      } else if (typeof message.content === 'string') {
        debugLog("?? ���ı���Ϣ������: %d", message.content.length);
      }
      
      processedMessages.push(processedMessage);
    }
    
    return processedMessages;
  }
  
  const DEBUG_MODE = Deno.env.get("DEBUG_MODE") !== "false"; // Ĭ��Ϊtrue
  const DEFAULT_STREAM = Deno.env.get("DEFAULT_STREAM") !== "false"; // Ĭ��Ϊtrue
  const DASHBOARD_ENABLED = Deno.env.get("DASHBOARD_ENABLED") !== "false"; // Ĭ��Ϊtrue
  
  /**
   * ȫ��״̬��?
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
   * ���ߺ���
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
    
    // ����ƽ����Ӧʱ��
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
    
    // ֻ���������100����?
    if (liveRequests.length > 100) {
      liveRequests = liveRequests.slice(1);
    }
  }
  
  function getLiveRequestsData(): string {
    try {
      // ȷ��liveRequests������
      if (!Array.isArray(liveRequests)) {
        debugLog("liveRequests�������飬����Ϊ������");
        liveRequests = [];
      }
      
      // ȷ�����ص����ݸ�ʽ��ǰ��������һ��
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
      debugLog("��ȡʵʱ��������ʧ��: %v", error);
      return JSON.stringify([]);
    }
  }
  
  function getStatsData(): string {
    try {
      // ȷ��stats�������
      if (!stats) {
        debugLog("stats���󲻴��ڣ�ʹ��Ĭ��ֵ");
        stats = {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          lastRequestTime: new Date(),
          averageResponseTime: 0
        };
      }
      
      // ȷ�����ص����ݸ�ʽ��ǰ��������һ?
      const statsData = {
        totalRequests: stats.totalRequests || 0,
        successfulRequests: stats.successfulRequests || 0,
        failedRequests: stats.failedRequests || 0,
        averageResponseTime: stats.averageResponseTime || 0
      };
      
      return JSON.stringify(statsData);
    } catch (error) {
      debugLog("��ȡͳ������ʧ��: %v", error);
      return JSON.stringify({
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0
      });
    }
  }
  
  function getClientIP(request: Request): string {
    // ���X-Forwarded-For?
    const xff = request.headers.get("X-Forwarded-For");
    if (xff) {
      const ips = xff.split(",");
      if (ips.length > 0) {
        return ips[0].trim();
      }
    }
    
    // ���X-Real-IP?
    const xri = request.headers.get("X-Real-IP");
    if (xri) {
      return xri;
    }
    
    // ����Deno Deploy�������޷�ֱ�ӻ�ȡRemoteAddr������һ��Ĭ?
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
      debugLog("��ȡ����tokenʧ��: %v", error);
      throw error;
    }
  }
  
  // ��������API
  async function callUpstreamWithHeaders(
    upstreamReq: UpstreamRequest, 
    refererChatID: string, 
    authToken: string
  ): Promise<Response> {
    try {
      debugLog("��������API: %s", UPSTREAM_URL);
      
      // �ر���ͼ�¼ȫ��λ��ģ̬��?
      const hasMultimedia = upstreamReq.messages.some(msg => 
        Array.isArray(msg.content) && 
        msg.content.some(block => 
          ['image_url', 'video_url', 'document_url', 'audio_url'].includes(block.type)
        )
      );
      
      if (hasMultimedia) {
        debugLog("?? ���������ģ̬���ݣ����ڷ��͵�����...");
        
        for (let i = 0; i < upstreamReq.messages.length; i++) {
          const msg = upstreamReq.messages[i];
          if (Array.isArray(msg.content)) {
            for (let j = 0; j < msg.content.length; j++) {
              const block = msg.content[j];
              
              // ����ͼ��
              if (block.type === 'image_url' && block.image_url?.url) {
                const url = block.image_url.url;
                if (url.startsWith('data:image/')) {
                  const mimeMatch = url.match(/data:image\/([^;]+)/);
                  const format = mimeMatch ? mimeMatch[1] : 'unknown';
                  const sizeKB = Math.round(url.length * 0.75 / 1024); // base64 ��Լ��ԭ�ļ�?1.33 ?
                  debugLog("???��Ϣ[%d] ͼ��[%d]: %s��ʽ, ���ݳ���: %d�ַ� (~%dKB)", 
                    i, j, format, url.length, sizeKB);
                  
                  // ͼƬ��С����
                  if (sizeKB > 1000) {
                    debugLog("??  ͼƬ�ϴ� (%dKB)�����ܵ������δ���ʧ��", sizeKB);
                    debugLog("?? ����: ��ͼƬѹ���� 500KB ����");
                  } else if (sizeKB > 500) {
                    debugLog("??  ͼƬƫ�� (%dKB)������ѹ��", sizeKB);
                  }
                } else {
                  debugLog("?? ��Ϣ[%d] ͼ��[%d]: �ⲿURL - %s", i, j, url);
                }
              }
              
              // ������Ƶ
              if (block.type === 'video_url' && block.video_url?.url) {
                const url = block.video_url.url;
                if (url.startsWith('data:video/')) {
                  const mimeMatch = url.match(/data:video\/([^;]+)/);
                  const format = mimeMatch ? mimeMatch[1] : 'unknown';
                  debugLog("?? ��Ϣ[%d] ��Ƶ[%d]: %s��ʽ, ���ݳ���: %d�ַ�", 
                    i, j, format, url.length);
                } else {
                  debugLog("?? ��Ϣ[%d] ��Ƶ[%d]: �ⲿURL - %s", i, j, url);
                }
              }
              
              // �����ĵ�
              if (block.type === 'document_url' && block.document_url?.url) {
                const url = block.document_url.url;
                if (url.startsWith('data:application/')) {
                  const mimeMatch = url.match(/data:application\/([^;]+)/);
                  const format = mimeMatch ? mimeMatch[1] : 'unknown';
                  debugLog("?? ��Ϣ[%d] �ĵ�[%d]: %s��ʽ, ���ݳ���: %d�ַ�", 
                    i, j, format, url.length);
                } else {
                  debugLog("?? ��Ϣ[%d] �ĵ�[%d]: �ⲿURL - %s", i, j, url);
                }
              }
              
              // ������Ƶ
              if (block.type === 'audio_url' && block.audio_url?.url) {
                const url = block.audio_url.url;
                if (url.startsWith('data:audio/')) {
                  const mimeMatch = url.match(/data:audio\/([^;]+)/);
                  const format = mimeMatch ? mimeMatch[1] : 'unknown';
                  debugLog("?? ��Ϣ[%d] ��Ƶ[%d]: %s��ʽ, ���ݳ���: %d�ַ�", 
                    i, j, format, url.length);
                } else {
                  debugLog("?? ��Ϣ[%d] ��Ƶ[%d]: �ⲿURL - %s", i, j, url);
                }
              }
            }
          }
        }
      }
      
      debugLog("��������? %s", JSON.stringify(upstreamReq));
      
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
      
      debugLog("������Ӧ? %d %s", response.status, response.statusText);
      return response;
    } catch (error) {
      debugLog("��������ʧ��: %v", error);
      throw error;
    }
  }
  
  function transformThinking(content: string): string {
    // ?<summary>?/summary>
    let result = content.replace(/<summary>.*?<\/summary>/gs, "");
    // ��������Զ����ǩ��?</thinking>?Full> ?
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
    
    // ����ÿ��ǰ׺ "> "��������ʼλ�ã�
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
        buffer = lines.pop() || ""; // �������һ������������
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.substring(6);
            if (dataStr === "") continue;
            
            debugLog("�յ�SSE����: %s", dataStr);
            
            try {
              const upstreamData = JSON.parse(dataStr) as UpstreamData;
              
              // �����?
              if (upstreamData.error || upstreamData.data.error || 
                  (upstreamData.data.inner && upstreamData.data.inner.error)) {
                const errObj = upstreamData.error || upstreamData.data.error || 
                             (upstreamData.data.inner && upstreamData.data.inner.error);
                debugLog("���δ���: code=%d, detail=%s", errObj?.code, errObj?.detail);
                
                // �����������ͣ��ر��Ƕ�ģ̬��ش���
                const errorDetail = (errObj?.detail || "").toLowerCase();
                if (errorDetail.includes("something went wrong") || errorDetail.includes("try again later")) {
                  debugLog("?? Z.ai �������������");
                  debugLog("   ?? ��������: %s", errObj?.detail);
                  debugLog("   ??? ����ԭ��: ͼƬ����ʧ��");
                  debugLog("   ?? ����������:");
                  debugLog("      1. ʹ�ø�С��ͼƬ(< 500KB)");
                  debugLog("      2. ���Բ�ͬ��ͼƬ��ʽ(JPEG ������PNG)");
                  debugLog("      3. �Ժ����� (�����Ƿ�������������)");
                  debugLog("      4. ���ͼƬ�Ƿ���");
                }
                
                // ���ͽ���chunk
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
              
              debugLog("�����ɹ� - ����: %s, �׶�: %s, ���ݳ���: %d, ���: %v",
                upstreamData.type, upstreamData.data.phase, 
                upstreamData.data.delta_content ? upstreamData.data.delta_content.length : 0, 
                upstreamData.data.done);
              
              // ��������
              if (upstreamData.data.delta_content && upstreamData.data.delta_content !== "") {
                let out = upstreamData.data.delta_content;
                if (upstreamData.data.phase === "thinking") {
                  out = transformThinking(out);
                }
                
                if (out !== "") {
                  debugLog("������?%s): %s", upstreamData.data.phase, out);
                  
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
              
              // ����Ƿ����
              if (upstreamData.data.done || upstreamData.data.phase === "done") {
                debugLog("��⵽�������ź�");
                
                // ���ͽ���chunk
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
              debugLog("SSE���ݽ���ʧ��: %v", error);
            }
          }
        }
      }
    } finally {
      writer.close();
    }
  }
  
  // �ռ�������Ӧ�����ڷ���ʽ��Ӧ?
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
        buffer = lines.pop() || ""; // �������һ������������
        
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
              
              // ����Ƿ����
              if (upstreamData.data.done || upstreamData.data.phase === "done") {
                debugLog("��⵽����źţ�ֹͣ�ռ�");
                return fullContent;
              }
            } catch (error) {
              // ���Խ�������
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
   * 生成首页HTML
   */
  function getIndexHTML(): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>公益API - OpenAI兼容接口服务</title>
    <link rel="stylesheet" href="https://cdn.bootcdn.net/ajax/libs/twitter-bootstrap/3.3.7/css/bootstrap.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #f8f9fa;
            margin: 0;
            padding: 0;
            line-height: 1.6;
            color: #2c3e50;
        }
        
        .navbar-custom {
            background-color: #2c3e50;
            border: none;
            min-height: 60px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .navbar-custom .navbar-brand {
            color: #ffffff !important;
            font-size: 22px;
            font-weight: 700;
            padding: 18px 15px;
        }
        
        .navbar-custom .navbar-nav > li > a {
            color: #ffffff !important;
            font-weight: 500;
            padding: 18px 20px;
            transition: background-color 0.3s ease;
        }
        
        .navbar-custom .navbar-nav > li > a:hover {
            background-color: rgba(255, 255, 255, 0.1) !important;
        }
        
        .main-content {
            min-height: calc(100vh - 120px);
            padding-bottom: 40px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        .card {
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
            margin-bottom: 30px;
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.12);
        }
        
        .card-header {
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: #ffffff;
            padding: 20px 25px;
            font-size: 18px;
            font-weight: 600;
        }
        
        .card-body {
            padding: 30px 25px;
        }
        
        .hero-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            padding: 80px 0;
            margin-bottom: 40px;
            text-align: center;
        }
        
        .hero-content {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        .hero-title {
            font-size: 3.5rem;
            font-weight: 700;
            margin-bottom: 20px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .hero-subtitle {
            font-size: 1.5rem;
            font-weight: 400;
            margin-bottom: 20px;
            opacity: 0.95;
        }
        
        .hero-description {
            font-size: 1.1rem;
            line-height: 1.8;
            margin-bottom: 40px;
            opacity: 0.9;
        }
        
        .btn {
            border-radius: 8px;
            padding: 12px 30px;
            font-weight: 600;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
            border: none;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: #ffffff;
            box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
        }
        
        .btn-success {
            background: linear-gradient(135deg, #27ae60, #229954);
            color: #ffffff;
            box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
        }
        
        .btn-lg {
            padding: 15px 40px;
            font-size: 1.1rem;
        }
        
        .footer {
            background-color: #2c3e50;
            color: #ecf0f1;
            text-align: center;
            padding: 40px 0;
            margin-top: 60px;
        }
        
        .footer a {
            color: #3498db;
            text-decoration: none;
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            background-color: #27ae60;
            border-radius: 50%;
            margin-right: 8px;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
        }
    </style>
</head>
<body>
    <nav class="navbar navbar-custom">
        <div class="container">
            <div class="navbar-header">
                <a class="navbar-brand" href="/">🌟 公益API</a>
            </div>
            <ul class="navbar-nav navbar-right">
                <li><a href="/v1/models">🤖 模型列表</a></li>
                <li><a href="https://www.nodeloc.com/u/pastking" target="_blank">👤 开发者</a></li>
            </ul>
        </div>
    </nav>

    <div class="main-content">
        <div class="container">
            <div class="hero-section">
                <div class="hero-content">
                    <h1 class="hero-title">公益API</h1>
                    <div class="hero-subtitle">免费 OpenAI 兼容接口服务</div>
                    <p class="hero-description">
                        为开发者提供免费、稳定的GLM-4.5模型API访问服务，完全兼容OpenAI接口标准。
                    </p>
                    <div>
                        <span class="status-indicator"></span>
                        <span style="color: rgba(255,255,255,0.9);">服务运行中</span>
                        <div style="margin-top: 20px;">
                            <a href="/v1/models" class="btn btn-primary btn-lg">🚀 查看可用模型</a>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    🤖 公益API服务
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            <h4 style="margin-top: 0;">GLM-4.5 AI模型</h4>
                            <p class="text-muted">提供高质量的文本生成和多模态理解能力，支持OpenAI API标准。</p>
                            <div style="margin: 20px 0;">
                                <p><strong>API地址:</strong> <code>当前域名</code></p>
                                <p><strong>聊天接口:</strong> <code>/v1/chat/completions</code></p>
                                <p><strong>模型列表:</strong> <code>/v1/models</code></p>
                                <p><strong>授权方式:</strong> Bearer your-api-key（任意字符串即可）</p>
                            </div>
                        </div>
                        <div class="col-md-4 text-center">
                            <a href="/v1/models" class="btn btn-success btn-lg">查看模型列表</a>
                            <div style="margin-top: 15px;">
                                <small class="text-muted">🎉 完全免费使用</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="footer">
        <div class="container">
            <p style="margin-bottom: 0;">
                © <a href="https://www.nodeloc.com/u/pastking" target="_blank">PastKing</a>
                <br>
                <small style="opacity: 0.8;">基于 Deno 构建 · 免费开源 · 服务开发者社区</small>
            </p>
        </div>
    </div>

    <script src="https://cdn.bootcdn.net/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
    <script src="https://cdn.bootcdn.net/ajax/libs/twitter-bootstrap/3.3.7/js/bootstrap.min.js"></script>
</body>
</html>`;
  }

  /**
   * HTTP服务器和路由处理
   */
  
  function getLiveRequestsData(): string {
    try {
      // ȷ��liveRequests������
      if (!Array.isArray(liveRequests)) {
        debugLog("liveRequests�������飬����Ϊ������");
        liveRequests = [];
      }
      
      // ȷ�����ص����ݸ�ʽ��ǰ��������һ��
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
      debugLog("��ȡʵʱ��������ʧ��: %v", error);
      return JSON.stringify([]);
    }
  }
  
  function getStatsData(): string {
    try {
      // ȷ��stats�������
      if (!stats) {
        debugLog("stats���󲻴��ڣ�ʹ��Ĭ��ֵ");
        stats = {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          lastRequestTime: new Date(),
          averageResponseTime: 0
        };
      }
      
      // ȷ�����ص����ݸ�ʽ��ǰ��������һ?
      const statsData = {
        totalRequests: stats.totalRequests || 0,
        successfulRequests: stats.successfulRequests || 0,
        failedRequests: stats.failedRequests || 0,
        averageResponseTime: stats.averageResponseTime || 0
      };
      
      return JSON.stringify(statsData);
    } catch (error) {
      debugLog("��ȡͳ������ʧ��: %v", error);
      return JSON.stringify({
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0
      });
    }
  }
  
  function getClientIP(request: Request): string {
    // ���X-Forwarded-For?
    const xff = request.headers.get("X-Forwarded-For");
    if (xff) {
      const ips = xff.split(",");
      if (ips.length > 0) {
        return ips[0].trim();
      }
    }
    
    // ���X-Real-IP?
    const xri = request.headers.get("X-Real-IP");
    if (xri) {
      return xri;
    }
    
    // ����Deno Deploy�������޷�ֱ�ӻ�ȡRemoteAddr������һ��Ĭ?
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
      debugLog("��ȡ����tokenʧ��: %v", error);
      throw error;
    }
  }
  
  // ��������API
  async function callUpstreamWithHeaders(
    upstreamReq: UpstreamRequest, 
    refererChatID: string, 
    authToken: string
  ): Promise<Response> {
    try {
      debugLog("��������API: %s", UPSTREAM_URL);
      
      // �ر���ͼ�¼ȫ��λ��ģ̬��?
      const hasMultimedia = upstreamReq.messages.some(msg => 
        Array.isArray(msg.content) && 
        msg.content.some(block => 
          ['image_url', 'video_url', 'document_url', 'audio_url'].includes(block.type)
        )
      );
      
      if (hasMultimedia) {
        debugLog("?? ���������ģ̬���ݣ����ڷ��͵�����...");
        
        for (let i = 0; i < upstreamReq.messages.length; i++) {
          const msg = upstreamReq.messages[i];
          if (Array.isArray(msg.content)) {
            for (let j = 0; j < msg.content.length; j++) {
              const block = msg.content[j];
              
              // ����ͼ��
              if (block.type === 'image_url' && block.image_url?.url) {
                const url = block.image_url.url;
                if (url.startsWith('data:image/')) {
                  const mimeMatch = url.match(/data:image\/([^;]+)/);
                  const format = mimeMatch ? mimeMatch[1] : 'unknown';
                  const sizeKB = Math.round(url.length * 0.75 / 1024); // base64 ��Լ��ԭ�ļ�?1.33 ?
                  debugLog("???��Ϣ[%d] ͼ��[%d]: %s��ʽ, ���ݳ���: %d�ַ� (~%dKB)", 
                    i, j, format, url.length, sizeKB);
                  
                  // ͼƬ��С����
                  if (sizeKB > 1000) {
                    debugLog("??  ͼƬ�ϴ� (%dKB)�����ܵ������δ���ʧ��", sizeKB);
                    debugLog("?? ����: ��ͼƬѹ���� 500KB ����");
                  } else if (sizeKB > 500) {
                    debugLog("??  ͼƬƫ�� (%dKB)������ѹ��", sizeKB);
                  }
                } else {
                  debugLog("?? ��Ϣ[%d] ͼ��[%d]: �ⲿURL - %s", i, j, url);
                }
              }
              
              // ������Ƶ
              if (block.type === 'video_url' && block.video_url?.url) {
                const url = block.video_url.url;
                if (url.startsWith('data:video/')) {
                  const mimeMatch = url.match(/data:video\/([^;]+)/);
                  const format = mimeMatch ? mimeMatch[1] : 'unknown';
                  debugLog("?? ��Ϣ[%d] ��Ƶ[%d]: %s��ʽ, ���ݳ���: %d�ַ�", 
                    i, j, format, url.length);
                } else {
                  debugLog("?? ��Ϣ[%d] ��Ƶ[%d]: �ⲿURL - %s", i, j, url);
                }
              }
              
              // �����ĵ�
              if (block.type === 'document_url' && block.document_url?.url) {
                const url = block.document_url.url;
                if (url.startsWith('data:application/')) {
                  const mimeMatch = url.match(/data:application\/([^;]+)/);
                  const format = mimeMatch ? mimeMatch[1] : 'unknown';
                  debugLog("?? ��Ϣ[%d] �ĵ�[%d]: %s��ʽ, ���ݳ���: %d�ַ�", 
                    i, j, format, url.length);
                } else {
                  debugLog("?? ��Ϣ[%d] �ĵ�[%d]: �ⲿURL - %s", i, j, url);
                }
              }
              
              // ������Ƶ
              if (block.type === 'audio_url' && block.audio_url?.url) {
                const url = block.audio_url.url;
                if (url.startsWith('data:audio/')) {
                  const mimeMatch = url.match(/data:audio\/([^;]+)/);
                  const format = mimeMatch ? mimeMatch[1] : 'unknown';
                  debugLog("?? ��Ϣ[%d] ��Ƶ[%d]: %s��ʽ, ���ݳ���: %d�ַ�", 
                    i, j, format, url.length);
                } else {
                  debugLog("?? ��Ϣ[%d] ��Ƶ[%d]: �ⲿURL - %s", i, j, url);
                }
              }
            }
          }
        }
      }
      
      debugLog("��������? %s", JSON.stringify(upstreamReq));
      
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
      
      debugLog("������Ӧ? %d %s", response.status, response.statusText);
      return response;
    } catch (error) {
      debugLog("��������ʧ��: %v", error);
      throw error;
    }
  }
  
  function transformThinking(content: string): string {
    // ?<summary>?/summary>
    let result = content.replace(/<summary>.*?<\/summary>/gs, "");
    // ��������Զ����ǩ��?</thinking>?Full> ?
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
    
    // ����ÿ��ǰ׺ "> "��������ʼλ�ã�
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
        buffer = lines.pop() || ""; // �������һ������������
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.substring(6);
            if (dataStr === "") continue;
            
            debugLog("�յ�SSE����: %s", dataStr);
            
            try {
              const upstreamData = JSON.parse(dataStr) as UpstreamData;
              
              // �����?
              if (upstreamData.error || upstreamData.data.error || 
                  (upstreamData.data.inner && upstreamData.data.inner.error)) {
                const errObj = upstreamData.error || upstreamData.data.error || 
                             (upstreamData.data.inner && upstreamData.data.inner.error);
                debugLog("���δ���: code=%d, detail=%s", errObj?.code, errObj?.detail);
                
                // �����������ͣ��ر��Ƕ�ģ̬��ش���
                const errorDetail = (errObj?.detail || "").toLowerCase();
                if (errorDetail.includes("something went wrong") || errorDetail.includes("try again later")) {
                  debugLog("?? Z.ai �������������");
                  debugLog("   ?? ��������: %s", errObj?.detail);
                  debugLog("   ??? ����ԭ��: ͼƬ����ʧ��");
                  debugLog("   ?? ����������:");
                  debugLog("      1. ʹ�ø�С��ͼƬ(< 500KB)");
                  debugLog("      2. ���Բ�ͬ��ͼƬ��ʽ(JPEG ������PNG)");
                  debugLog("      3. �Ժ����� (�����Ƿ�������������)");
                  debugLog("      4. ���ͼƬ�Ƿ���");
                }
                
                // ���ͽ���chunk
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
              
              debugLog("�����ɹ� - ����: %s, �׶�: %s, ���ݳ���: %d, ���: %v",
                upstreamData.type, upstreamData.data.phase, 
                upstreamData.data.delta_content ? upstreamData.data.delta_content.length : 0, 
                upstreamData.data.done);
              
              // ��������
              if (upstreamData.data.delta_content && upstreamData.data.delta_content !== "") {
                let out = upstreamData.data.delta_content;
                if (upstreamData.data.phase === "thinking") {
                  out = transformThinking(out);
                }
                
                if (out !== "") {
                  debugLog("������?%s): %s", upstreamData.data.phase, out);
                  
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
              
              // ����Ƿ����
              if (upstreamData.data.done || upstreamData.data.phase === "done") {
                debugLog("��⵽�������ź�");
                
                // ���ͽ���chunk
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
              debugLog("SSE���ݽ���ʧ��: %v", error);
            }
          }
        }
      }
    } finally {
      writer.close();
    }
  }
  
  // �ռ�������Ӧ�����ڷ���ʽ��Ӧ?
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
        buffer = lines.pop() || ""; // �������һ������������
        
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
              
              // ����Ƿ����
              if (upstreamData.data.done || upstreamData.data.phase === "done") {
                debugLog("��⵽����źţ�ֹͣ�ռ�");
                return fullContent;
              }
            } catch (error) {
              // ���Խ�������
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
      <title>����API - רҵOpenAI���ݽӿڷ���</title>
      <link href="https://cdn.bootcdn.net/ajax/libs/twitter-bootstrap/3.3.7/css/bootstrap.min.css" rel="stylesheet">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
          /* ������ʽ���� */
          * {
              box-sizing: border-box;
          }
          
          body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              background-color: #f8f9fa;
              margin: 0;
              padding: 0;
              line-height: 1.6;
              color: #2c3e50;
          }
          
          /* ��������?*/
          .navbar-custom {
              background-color: #2c3e50;
              border: none;
              border-radius: 0;
              margin-bottom: 0;
              min-height: 60px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          
          .navbar-custom .navbar-brand {
              color: #ffffff !important;
              font-size: 22px;
              font-weight: 700;
              padding: 18px 15px;
              text-decoration: none;
          }
          
          .navbar-custom .navbar-brand:hover {
              color: #ffffff !important;
              text-decoration: none;
          }
          
          .navbar-custom .navbar-nav > li > a {
              color: #ffffff !important;
              font-size: 16px;
              padding: 20px 20px;
              transition: background-color 0.3s ease;
              text-decoration: none;
          }
          
          .navbar-custom .navbar-nav > li > a:hover {
              background-color: rgba(255, 255, 255, 0.1) !important;
              color: #ffffff !important;
              text-decoration: none;
          }
          
          /* ��������Ҫ������?*/
          .main-content {
              min-height: calc(100vh - 60px);
              padding: 40px 0;
          }
          
          .container {
              max-width: 1200px;
              margin: 0 auto;
              padding: 0 15px;
          }
          
          /* ��Ƭ��ʽ */
          .card {
              background: #ffffff;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
              margin-bottom: 30px;
              overflow: hidden;
              border: 1px solid #e9ecef;
              transition: all 0.3s ease;
          }
          
          .card:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
          }
          
          .card-header {
              background: #f8f9fa;
              border-bottom: 1px solid #e9ecef;
              padding: 20px 30px;
              font-weight: 600;
              font-size: 18px;
              color: #2c3e50;
          }
          
          .card-body {
              padding: 30px;
          }
          
          /* Ӣ��������ʽ */
          .hero-section {
              background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
              color: white;
              text-align: center;
              padding: 80px 30px;
              margin-bottom: 40px;
              border-radius: 8px;
              position: relative;
              overflow: hidden;
          }
          
          .hero-section::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
              opacity: 0.1;
          }
          
          .hero-content {
              position: relative;
              z-index: 1;
          }
          
          .hero-title {
              font-size: 3.5rem;
              font-weight: 700;
              margin-bottom: 20px;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          
          .hero-subtitle {
              font-size: 1.3rem;
              margin-bottom: 15px;
              opacity: 0.95;
              font-weight: 500;
          }
          
          .hero-description {
              font-size: 1.1rem;
              opacity: 0.9;
              max-width: 600px;
              margin: 0 auto 30px auto;
              line-height: 1.7;
          }
          
          /* ��ť��ʽ */
          .btn {
              padding: 12px 25px;
              font-size: 16px;
              font-weight: 600;
              border-radius: 6px;
              border: none;
              cursor: pointer;
              transition: all 0.3s ease;
              text-decoration: none;
              display: inline-block;
              text-align: center;
              line-height: 1.4;
          }
          
          .btn-primary {
              background-color: #3498db;
              color: #ffffff;
          }
          
          .btn-primary:hover {
              background-color: #2980b9;
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
              color: #ffffff;
              text-decoration: none;
          }
          
          .btn-success {
              background-color: #27ae60;
              color: #ffffff;
          }
          
          .btn-success:hover {
              background-color: #229954;
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
              color: #ffffff;
              text-decoration: none;
          }
          
          .btn-lg {
              padding: 15px 35px;
              font-size: 18px;
          }
          
          /* ���Կ�Ƭ��?*/
          .features-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              gap: 30px;
              margin-top: 30px;
          }
          
          .feature-card {
              background: #ffffff;
              border-radius: 8px;
              padding: 30px;
              text-align: center;
              border: 1px solid #e9ecef;
              transition: all 0.3s ease;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
          }
          
          .feature-card:hover {
              transform: translateY(-5px);
              box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
          }
          
          .feature-icon {
              font-size: 3rem;
              margin-bottom: 20px;
              display: block;
              color: #3498db;
          }
          
          .feature-title {
              font-size: 1.3rem;
              font-weight: 600;
              color: #2c3e50;
              margin-bottom: 15px;
          }
          
          .feature-description {
              color: #7f8c8d;
              line-height: 1.6;
          }
          
          /* ҳ����ʽ */
          .footer {
              background-color: #2c3e50;
              color: #ffffff;
              text-align: center;
              padding: 30px 0;
              margin-top: 60px;
          }
          
          .footer a {
              color: #3498db;
              text-decoration: none;
              font-weight: 500;
          }
          
          .footer a:hover {
              color: #5dade2;
              text-decoration: none;
          }
          
          /* ״ָ̬ʾ�� */
          .status-indicator {
              display: inline-block;
              width: 12px;
              height: 12px;
              border-radius: 50%;
              background-color: #27ae60;
              margin-right: 8px;
              animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
              0% { opacity: 1; }
              50% { opacity: 0.6; }
              100% { opacity: 1; }
          }
          
          /* ��Ӧʽ��?*/
          @media (max-width: 768px) {
              .main-content {
                  padding: 20px 0;
              }
              
              .hero-section {
                  padding: 50px 20px;
              }
              
              .hero-title {
                  font-size: 2.5rem;
              }
              
              .hero-subtitle {
                  font-size: 1.1rem;
              }
              
              .card-body {
                  padding: 20px;
              }
              
              .btn {
                  padding: 10px 20px;
                  font-size: 14px;
              }
              
              .features-grid {
                  grid-template-columns: 1fr;
                  gap: 20px;
              }
              
              .feature-card {
                  padding: 20px;
              }
          }
          
          @media (max-width: 480px) {
              .hero-title {
                  font-size: 2rem;
              }
              
      .container {
                  padding: 0 10px;
              }
          }
          
          /* ʵ�ù���?*/
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .mb-0 { margin-bottom: 0 !important; }
          .mb-1 { margin-bottom: 10px !important; }
          .mb-2 { margin-bottom: 20px !important; }
          .mb-3 { margin-bottom: 30px !important; }
          .mt-0 { margin-top: 0 !important; }
          .mt-1 { margin-top: 10px !important; }
          .mt-2 { margin-top: 20px !important; }
          .mt-3 { margin-top: 30px !important; }
  </style>
  </head>
  <body>
      <!-- ����?-->
      <nav class="navbar navbar-custom">
  <div class="container">
              <div class="navbar-header">
                  <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar-collapse">
                      <span class="sr-only">Toggle navigation</span>
                      <span class="icon-bar"></span>
                      <span class="icon-bar"></span>
                      <span class="icon-bar"></span>
                  </button>
                  <a class="navbar-brand" href="/">?? ����API</a>
              </div>
              <div class="collapse navbar-collapse" id="navbar-collapse">
                  <ul class="navbar-nav navbar-right">
                      <li><a href="/v1/models">?? ģ���б�</a></li>
                      <li><a href="HTTP服务器和路由处理
          </ul>
      </div>
          </div>
      </nav>

      <!-- ��Ҫ���� -->
      <div class="main-content">
          <div class="container">
              <!-- Ӣ������ -->
              <div class="hero-section">
                  <div class="hero-content">
                      <h1 class="hero-title">����API</h1>
                      <div class="hero-subtitle">רҵ?OpenAI ���ݽӿڷ���</div>
                      <p class="hero-description">
                          �ṩ��ѡ��ȶ���������?GLM-4.5 ģ�ͷ��ʷ�����ȫ��?OpenAI �ӿڱ�׼?
                          Ϊ�����ߺ��о����ṩ��ݵ�AI�������룬��������Ӧ�ÿ���?
                      </p>
                      <div class="text-center">
                          <span class="status-indicator"></span>
                          <span style="color: rgba(255,255,255,0.9);">��������?/span>
                          <div class="mt-2">
                              <a href="/v1/models" class="btn btn-primary btn-lg">?? ��ʼʹ?/a>
              </div>
              </div>
              </div>
          </div>
          
              <!-- API���ʿ�Ƭ -->
              <div class="card">
                  <div class="card-header">
                      ?? ����ģ��
              </div>
                  <div class="card-body">
                      <div class="row">
                          <div class="col-md-8">
                              <h4 class="mt-0">GLM-4.5 ϵ��ģ��</h4>
                              <p class="text-muted">֧���ı����ɡ���ģ̬���ȶ���AI����������OpenAI��׼�ӿ�?/p>
                              <ul class="list-unstyled">
                                  <li><strong>GLM-4.5</strong> - �������ı�����ģ��</li>
                                  <li><strong>GLM-4.5V</strong> - ��ģ̬���ģ�ͣ�ͼ����Ƶ���ĵ���</li>
                              </ul>
              </div>
                          <div class="col-md-4 text-center">
                              <a href="/v1/models" class="btn btn-success">�鿴ģ���б�</a>
                              <div class="mt-2">
                                  <small class="text-muted">��ȫ���ʹ��</small>
              </div>
              </div>
          </div>
          </div>
          </div>
          
              <!-- ����չ?-->
              <div class="card">
                  <div class="card-header">
                      ?������?
          </div>
                  <div class="card-body">
                      <div class="features-grid">
                          <div class="feature-card">
                              <div class="feature-icon">?/div>
                              <h4 class="feature-title">������</h4>
                              <p class="feature-description">�Ż������������ʽ��Ӧ��ȷ�������ȶ���API��������</p>
          </div>
                          <div class="feature-card">
                              <div class="feature-icon">??</div>
                              <h4 class="feature-title">��ȫ�ɿ�</h4>
                              <p class="feature-description">������ҵ����ȫ��ʩ���������ݴ����API���ʵİ�ȫ?/p>
                          </div>
                          <div class="feature-card">
                              <div class="feature-icon">??</div>
                              <h4 class="feature-title">��ȫ����</h4>
                              <p class="feature-description">100% ���� OpenAI API ��׼�������޸����д��뼴���л�ʹ��</p>
                          </div>
                          <div class="feature-card">
                              <div class="feature-icon">??</div>
                              <h4 class="feature-title">��ģ̬֧?/h4>
                              <p class="feature-description">֧���ı���ͼ����Ƶ�ȶ������ݸ�ʽ�����ܴ�������</p>
                          </div>
                          <div class="feature-card">
                              <div class="feature-icon">??</div>
                              <h4 class="feature-title">��ȫ���</h4>
                              <p class="feature-description">�������ʷ������踶�Ѽ�������רҵ����AI�ӿڷ���</p>
                          </div>
                          <div class="feature-card">
                              <div class="feature-icon">??</div>
                              <h4 class="feature-title">ʵʱ���</h4>
                              <p class="feature-description">�ṩ��ϸ��ʹ��ͳ�ƺ����ܼ�أ����ڿ������Ժ��Ż�</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <!-- ҳ�� -->
      <div class="footer">
          <div class="container">
              <p class="mb-0">
                  ? <a href="https://www.nodeloc.com/u/pastking" target="_blank">@https://www.nodeloc.com/u/pastking</a>
                  <br>
                  <small style="opacity: 0.8;">���� Deno ���� �� ��ѿ�?�� ���񿪷�����?/small>
              </p>
          </div>
  </div>
  
      <!-- JavaScript -->
      <script src="https://cdn.bootcdn.net/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
      <script src="https://cdn.bootcdn.net/ajax/libs/twitter-bootstrap/3.3.7/js/bootstrap.min.js"></script>
  </body>
  </html>`;
  }
  
  /**
   * HTTP服务器和路由处理
   */
  
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
    
    // ֧�ֵ�ģ��
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
    
    debugLog("�յ�chat completions����");
    
    const headers = new Headers();
    setCORSHeaders(headers);
    
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 200, headers });
    }
    
    // ��֤API Key
    const authHeader = request.headers.get("Authorization");
    if (!validateApiKey(authHeader)) {
      debugLog("ȱ�ٻ���Ч��Authorizationͷ");
      const duration = Date.now() - startTime;
      recordRequestStats(startTime, path, 401);
      addLiveRequest(request.method, path, 401, duration, userAgent);
      return new Response("Missing or invalid Authorization header", { 
        status: 401,
        headers 
      });
    }
    
    // ��ȡ������
    let body: string;
    try {
      body = await request.text();
    } catch (error) {
      debugLog("��ȡ������ʧ��: %v", error);
      const duration = Date.now() - startTime;
      recordRequestStats(startTime, path, 400);
      addLiveRequest(request.method, path, 400, duration, userAgent);
      return new Response("Failed to read request body", { 
        status: 400,
        headers 
      });
    }
    
    // ��������
    let req: OpenAIRequest;
    try {
      req = JSON.parse(body) as OpenAIRequest;
    } catch (error) {
      debugLog("JSON����ʧ��: %v", error);
      const duration = Date.now() - startTime;
      recordRequestStats(startTime, path, 400);
      addLiveRequest(request.method, path, 400, duration, userAgent);
      return new Response("Invalid JSON", { 
        status: 400,
        headers 
      });
    }
    
    // ����ͻ���û����ȷָ��stream������ʹ��Ĭ��ֵ
    if (!body.includes('"stream"')) {
      req.stream = DEFAULT_STREAM;
    }
    
    // ��ȡģ������
    const modelConfig = getModelConfig(req.model);
    
    // �������֤��Ϣ
    const processedMessages = processMessages(req.messages, modelConfig);
    
    // ���ɻỰ���ID
    const chatID = `${Date.now()}-${Math.floor(Date.now() / 1000)}`;
    const msgID = Date.now().toString();
    
    // ������������
    const upstreamReq: UpstreamRequest = {
      stream: true,
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
      tool_servers: [],
      variables: {
        "{{USER_NAME}}": `Guest-${Date.now()}`,
        "{{CURRENT_DATETIME}}": new Date().toLocaleString('zh-CN')
      }
    };
    
    // ѡ��token
    let authToken = ZAI_TOKEN;
    if (ANON_TOKEN_ENABLED) {
      try {
        const anonToken = await getAnonymousToken();
        authToken = anonToken;
      } catch (error) {
        debugLog("����token��ȡʧ�ܣ����˹̶�token: %v", error);
      }
    }
    
    // ��������API
    try {
      if (req.stream) {
        return await handleStreamResponse(upstreamReq, chatID, authToken, startTime, path, userAgent, req, modelConfig);
      } else {
        return await handleNonStreamResponse(upstreamReq, chatID, authToken, startTime, path, userAgent, req, modelConfig);
      }
    } catch (error) {
      debugLog("��������ʧ��: %v", error);
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
    try {
      const response = await callUpstreamWithHeaders(upstreamReq, chatID, authToken);
      
      if (!response.ok) {
        const duration = Date.now() - startTime;
        recordRequestStats(startTime, path, 502);
        addLiveRequest("POST", path, 502, duration, userAgent);
        return new Response("Upstream error", { status: 502 });
      }
      
      if (!response.body) {
        const duration = Date.now() - startTime;
        recordRequestStats(startTime, path, 502);
        addLiveRequest("POST", path, 502, duration, userAgent);
        return new Response("Upstream response body is empty", { status: 502 });
      }
      
      // ������ʽ��Ӧ
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();
      
      // ���͵�һ��chunk
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
      
      writer.write(encoder.encode(`data: ${JSON.stringify(firstChunk)}\n\n`));
      
      // ����������
      processUpstreamStream(response.body, writer, encoder, req.model).catch(error => {
        debugLog("����������ʱ����: %v", error);
      });
      
      // ��¼�ɹ�ͳ��
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
    try {
      const response = await callUpstreamWithHeaders(upstreamReq, chatID, authToken);
      
      if (!response.ok) {
        const duration = Date.now() - startTime;
        recordRequestStats(startTime, path, 502);
        addLiveRequest("POST", path, 502, duration, userAgent);
        return new Response("Upstream error", { status: 502 });
      }
      
      if (!response.body) {
        const duration = Date.now() - startTime;
        recordRequestStats(startTime, path, 502);
        addLiveRequest("POST", path, 502, duration, userAgent);
        return new Response("Upstream response body is empty", { status: 502 });
      }
      
      // �ռ�������Ӧ
      const finalContent = await collectFullResponse(response.body);
      
      // ������Ӧ
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
      
      // ��¼�ɹ�ͳ��
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
      const duration = Date.now() - startTime;
      recordRequestStats(startTime, path, 502);
      addLiveRequest("POST", path, 502, duration, userAgent);
      return new Response("Failed to process non-stream response", { status: 502 });
    }
  }
  
  // Dashboard���ĵ��������Ƴ�

  // ��HTTP服务器和路由处理
  async function main() {
  console.log(`OpenAI����API���������`);
  console.log(`֧�ֵ�ģ��: ${SUPPORTED_MODELS.map(m => `${m.id} (${m.name})`).join(', ')}`);
  console.log(`����: ${UPSTREAM_URL}`);
  console.log(`Debugģʽ: ${DEBUG_MODE}`);
  console.log(`Ĭ����ʽ��Ӧ: ${DEFAULT_STREAM}`);
  console.log(`Dashboard����: ${DASHBOARD_ENABLED}`);
  
  // ����Ƿ���Deno Deploy������
  const isDenoDeploy = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;
  
  if (isDenoDeploy) {
    // Deno Deploy����
    console.log("������Deno Deploy������");
    Deno.serve(handleRequest);
  } else {
    // ���ػ����йܻ���
    const port = parseInt(Deno.env.get("PORT") || "9090");
    console.log(`�����ڱ��ػ����У��˿�: ${port}`);
    
    const server = Deno.listen({ port });
    
    for await (const conn of server) {
      handleHttp(conn);
    }
  }
  }
  
  // ����HTTP服务器和路由处理
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
    // ·�ɷַ�
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
      // ����ͳ������handleChatCompletions�м�¼
    } else {
      const response = await handleOptions(request);
      await respondWith(response);
      recordRequestStats(startTime, url.pathname, response.status);
      addLiveRequest(request.method, url.pathname, response.status, Date.now() - startTime, userAgent);
    }
  } catch (error) {
    debugLog("��������ʱ����: %v", error);
    const response = new Response("Internal Server Error", { status: 500 });
    await respondWith(response);
    recordRequestStats(startTime, url.pathname, 500);
    addLiveRequest(request.method, url.pathname, 500, Date.now() - startTime, userAgent);
  }
  }
  }
  
  // ����HTTP服务器和路由处理
  async function handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const startTime = Date.now();
    const userAgent = request.headers.get("User-Agent") || "";
  
    try {
      // ·�ɷַ�
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
        // ����ͳ������handleChatCompletions�м�¼
        return response;
      } else {
        const response = await handleOptions(request);
        recordRequestStats(startTime, url.pathname, response.status);
        addLiveRequest(request.method, url.pathname, response.status, Date.now() - startTime, userAgent);
        return response;
      }
    } catch (error) {
      debugLog("��������ʱ����: %v", error);
      recordRequestStats(startTime, url.pathname, 500);
      addLiveRequest(request.method, url.pathname, 500, Date.now() - startTime, userAgent);
      return new Response("Internal Server Error", { status: 500 });
    }
  }
  
  // ���������
  main();


