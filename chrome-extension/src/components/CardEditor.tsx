import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import type { PromptCard, PromptTemplate, ToneType, AIModel } from '@/types';
import clsx from 'clsx';

const TONES: ToneType[] = ['professional', 'casual', 'neutral', 'strict'];

const MODELS: { value: AIModel; label: string }[] = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4.1', label: 'GPT-4.1' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  { value: 'llama-3.1-70b', label: 'Llama 3.1 70B' },
  { value: 'mixtral-8x7b', label: 'Mixtral 8x7B' },
  { value: 'deepseek-chat', label: 'DeepSeek Chat' },
  { value: 'deepseek-coder', label: 'DeepSeek Coder' },
];

export function CardEditor() {
  const { selectedCard, setIsEditing, addCard, updateCard, cards } = useAppStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [system, setSystem] = useState('');
  const [instruction, setInstruction] = useState('');
  const [tone, setTone] = useState<ToneType>('professional');
  const [maxWords, setMaxWords] = useState(100);
  const [rules, setRules] = useState<string[]>([]);
  const [newRule, setNewRule] = useState('');
  const [modelOverride, setModelOverride] = useState<AIModel | ''>('');
  const [variables, setVariables] = useState<string[]>(['selection']);

  useEffect(() => {
    if (selectedCard) {
      setTitle(selectedCard.title);
      setDescription(selectedCard.description);
      setSystem(selectedCard.template.system);
      setInstruction(selectedCard.template.instruction);
      setTone(selectedCard.template.tone);
      setMaxWords(selectedCard.template.maxWords);
      setRules(selectedCard.template.rules);
      setModelOverride(selectedCard.modelOverride || '');
      setVariables(selectedCard.variables);
    }
  }, [selectedCard]);

  const handleSave = () => {
    const template: PromptTemplate = {
      system,
      instruction,
      tone,
      maxWords,
      rules,
    };

    if (selectedCard) {
      updateCard({
        ...selectedCard,
        title,
        description,
        template,
        variables,
        modelOverride: modelOverride || undefined,
        updatedAt: Date.now(),
      });
    } else {
      const newCard: PromptCard = {
        id: `card-${Date.now()}`,
        title,
        description,
        template,
        variables,
        modelOverride: modelOverride || undefined,
        order: cards.length,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      addCard(newCard);
    }

    setIsEditing(false);
  };

  const addRule = () => {
    if (newRule.trim()) {
      setRules([...rules, newRule.trim()]);
      setNewRule('');
    }
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const VARIABLE_OPTIONS = [
    { value: 'selection', label: '{{selection}}' },
    { value: 'pageTitle', label: '{{pageTitle}}' },
    { value: 'pageUrl', label: '{{pageUrl}}' },
    { value: 'pageContent', label: '{{pageContent}}' },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center justify-between px-3 py-2 bg-surface-secondary border-b border-surface-border">
        <button
          onClick={() => setIsEditing(false)}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={handleSave}
          disabled={!title.trim() || !instruction.trim()}
          className="btn btn-primary text-sm py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
      </div>

      <div className="p-3 space-y-4">
        {/* Basic Info */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Rephrase Professional"
              className="input"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Rewrite text in a professional tone"
              className="input"
            />
          </div>
        </div>

        {/* Prompt Template */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Prompt Template</h3>
          
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">System Prompt</label>
            <textarea
              value={system}
              onChange={(e) => setSystem(e.target.value)}
              placeholder="e.g., You are a professional writing assistant."
              rows={2}
              className="input resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Instruction *</label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g., Rephrase the following text in a professional tone:"
              rows={2}
              className="input resize-none"
            />
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Settings</h3>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Tone</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map(t => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize',
                    tone === t
                      ? 'bg-accent text-white'
                      : 'bg-surface-tertiary text-text-secondary hover:bg-surface-hover'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Max Words: {maxWords === 0 ? 'Unlimited' : maxWords}
            </label>
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={maxWords}
              onChange={(e) => setMaxWords(Number(e.target.value))}
              className="w-full h-2 bg-surface-tertiary rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Model Override</label>
            <select
              value={modelOverride}
              onChange={(e) => setModelOverride(e.target.value as AIModel | '')}
              className="input"
            >
              <option value="">Use default model</option>
              {MODELS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Variables</label>
            <div className="flex flex-wrap gap-2">
              {VARIABLE_OPTIONS.map(v => (
                <button
                  key={v.value}
                  onClick={() => {
                    if (variables.includes(v.value)) {
                      setVariables(variables.filter(x => x !== v.value));
                    } else {
                      setVariables([...variables, v.value]);
                    }
                  }}
                  className={clsx(
                    'px-2 py-1 rounded text-xs font-mono transition-colors',
                    variables.includes(v.value)
                      ? 'bg-accent/20 text-accent'
                      : 'bg-surface-tertiary text-text-muted hover:text-text-secondary'
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rules */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Rules</h3>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              placeholder="e.g., No greetings"
              className="input flex-1"
              onKeyDown={(e) => e.key === 'Enter' && addRule()}
            />
            <button
              onClick={addRule}
              className="btn btn-secondary p-2"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {rules.length > 0 && (
            <div className="space-y-1">
              {rules.map((rule, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-3 py-2 bg-surface-tertiary rounded-lg"
                >
                  <span className="text-xs text-text-primary">{rule}</span>
                  <button
                    onClick={() => removeRule(index)}
                    className="p-1 rounded hover:bg-surface-hover text-text-muted hover:text-error transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
