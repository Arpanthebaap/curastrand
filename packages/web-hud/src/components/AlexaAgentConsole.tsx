import React, { useState } from 'react';
import { Send, Volume2, VolumeX, Sparkles, Terminal, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface Props {
  onSendQuery: (query: string) => Promise<any>;
  isLoading: boolean;
  lastAssessment: any;
  lastDispatch: any;
}

export const AlexaAgentConsole: React.FC<Props> = ({
  onSendQuery,
  isLoading,
  lastAssessment,
  lastDispatch
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [conversationHistory, setConversationHistory] = useState<Array<{ sender: 'user' | 'alexa'; text: string; timestamp: string }>>([
    {
      sender: 'alexa',
      text: 'CuraStrand Alexa+ Clinical Guardian active. Continuous ambient vital and acoustic streams synchronized. How can I help you?',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  const speakText = (text: string) => {
    if (!speechEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis error fallback
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isLoading) return;

    const userText = inputQuery.trim();
    setInputQuery('');

    const time = new Date().toLocaleTimeString();
    setConversationHistory(prev => [...prev, { sender: 'user', text: userText, timestamp: time }]);

    const result = await onSendQuery(userText);
    if (result && result.alexaResponse) {
      setConversationHistory(prev => [
        ...prev,
        { sender: 'alexa', text: result.alexaResponse, timestamp: new Date().toLocaleTimeString() }
      ]);
      speakText(result.alexaResponse);
    }
  };

  const handlePreset = (preset: string) => {
    setInputQuery(preset);
  };

  return (
    <div className="clinical-card rounded-xl p-5 border border-slate-800 flex flex-col h-[520px]">
      {/* Console Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-300 flex items-center gap-2">
              Alexa+ Agentic Voice Console
              <span className="text-[10px] bg-cyan-900/60 text-cyan-300 px-2 py-0.5 rounded font-mono border border-cyan-700/50">
                MCP Spec 2025-11-25
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Engine: <span className="text-purple-400">Amazon Bedrock (Claude 3.5 / Nova) + Strands SDK</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setSpeechEnabled(!speechEnabled)}
          className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
            speechEnabled
              ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
          }`}
          title="Toggle Alexa Spoken Audio Feedback"
        >
          {speechEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          <span className="font-mono text-[11px]">{speechEnabled ? 'Voice ON' : 'Muted'}</span>
        </button>
      </div>

      {/* Conversation Stream & Tool Logs */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-sm font-sans mb-3">
        {conversationHistory.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 mb-1 px-1">
              <span>{msg.sender === 'user' ? 'User Voice Prompt' : 'Alexa+ Agent Core'}</span>
              <span>•</span>
              <span>{msg.timestamp}</span>
            </div>
            <div
              className={`rounded-xl px-4 py-2.5 max-w-[88%] leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-cyan-600/20 border border-cyan-500/40 text-cyan-100 rounded-br-none'
                  : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-none shadow-md'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono p-3 bg-slate-900/60 rounded-lg border border-slate-800 animate-pulse">
            <Terminal className="w-4 h-4 animate-spin" />
            <span>Executing Model Context Protocol Multi-Agent Loop...</span>
          </div>
        )}

        {/* Live MCP Tool Execution Trace */}
        {lastAssessment && (
          <div className="p-3 bg-black/40 rounded-lg border border-slate-800 text-xs font-mono space-y-2 mt-2">
            <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800/80">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <Terminal className="w-3.5 h-3.5" /> MCP Execution Trace:
              </span>
              <span className="text-[10px] text-slate-500">JSON-RPC 2.0 Streamable HTTP</span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>tools/call: triage_evaluator → Level {lastAssessment.triageEvaluation?.level} ({lastAssessment.triageEvaluation?.category})</span>
              </div>
              <div className="flex items-center gap-1.5 text-purple-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>resources/read: patient://ehr/{lastAssessment.patientId}</span>
              </div>
              {lastDispatch && (
                <div className="flex items-center gap-1.5 text-rose-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>tools/call: ems_dispatcher → CAD Incident #{lastDispatch.cadIncidentId}</span>
                </div>
              )}
              {lastDispatch?.ringDoorUnlocked && (
                <div className="flex items-center gap-1.5 text-amber-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>tools/call: perimeter_controller → Deadbolt Unlocked</span>
                </div>
              )}
            </div>

            {/* Safety Proof Hash */}
            <div className="pt-1 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> MTS Safety Invariant Proof:
              </span>
              <span className="font-mono text-cyan-400">{lastAssessment.safetyVerification?.proofHash}</span>
            </div>
          </div>
        )}
      </div>

      {/* Preset Fast Prompts */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 text-[11px] font-mono text-slate-400">
        <button
          onClick={() => handlePreset('Alexa, Robert collapsed on the floor and is not responding!')}
          className="whitespace-nowrap px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-rose-300 transition-colors"
        >
          🚨 "Robert collapsed / unresponsive"
        </button>
        <button
          onClick={() => handlePreset('Alexa, I have sudden severe crushing chest pain.')}
          className="whitespace-nowrap px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-amber-300 transition-colors"
        >
          💔 "Crushing chest pain"
        </button>
        <button
          onClick={() => handlePreset('Alexa, what are my current vital signs?')}
          className="whitespace-nowrap px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-cyan-300 transition-colors"
        >
          📊 "Check my vitals"
        </button>
      </div>

      {/* Input box */}
      <form onSubmit={handleSubmit} className="flex gap-2 pt-2 border-t border-slate-800">
        <input
          type="text"
          value={inputQuery}
          onChange={e => setInputQuery(e.target.value)}
          placeholder="Speak or type to Alexa+ (e.g. 'Alexa, Robert is choking...')"
          className="flex-1 bg-slate-900/90 border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-sans"
        />
        <button
          type="submit"
          disabled={isLoading || !inputQuery.trim()}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-900 font-semibold rounded-lg text-sm flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-900/30"
        >
          <Send className="w-4 h-4" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
