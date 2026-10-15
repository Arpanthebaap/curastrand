/**
 * CuraStrand MCP Client
 * Streamable HTTP Transport Client adhering to MCP Specification 2025-11-25.
 */

export class McpClient {
  private serverUrl: string;
  private messageUrl: string;
  private sessionId: string | null = null;
  private messageCounter = 1;

  constructor(serverUrl: string = 'http://localhost:3001') {
    this.serverUrl = serverUrl;
    this.messageUrl = `${serverUrl}/mcp/messages`;
  }

  public async initialize(): Promise<any> {
    const response = await this.rpcCall('initialize', {
      protocolVersion: '2025-11-25',
      clientInfo: {
        name: 'curastrand-agent-core',
        version: '1.0.0'
      },
      capabilities: {
        tools: {},
        resources: {}
      }
    });
    return response;
  }

  public async listTools(): Promise<any[]> {
    const response = await this.rpcCall('tools/list', {});
    return response.tools || [];
  }

  public async callTool(toolName: string, args: Record<string, any>): Promise<any> {
    const response = await this.rpcCall('tools/call', {
      name: toolName,
      arguments: args
    });

    if (response?.content?.[0]?.text) {
      try {
        return JSON.parse(response.content[0].text);
      } catch {
        return response.content[0].text;
      }
    }
    return response;
  }

  public async readResource(uri: string): Promise<any> {
    const response = await this.rpcCall('resources/read', { uri });
    if (response?.contents?.[0]?.text) {
      try {
        return JSON.parse(response.contents[0].text);
      } catch {
        return response.contents[0].text;
      }
    }
    return response;
  }

  private async rpcCall(method: string, params: Record<string, any>): Promise<any> {
    const id = this.messageCounter++;
    const payload = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    const res = await fetch(this.messageUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`MCP Streamable HTTP error: ${res.status} ${res.statusText}`);
    }

    const data: any = await res.json();
    if (data.error) {
      throw new Error(`MCP RPC Error (${data.error.code}): ${data.error.message}`);
    }

    return data.result;
  }
}

export const mcpClient = new McpClient();
