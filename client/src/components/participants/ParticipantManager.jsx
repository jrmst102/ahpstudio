import React, { useState, useEffect, useCallback, useRef } from 'react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Alert from '../common/Alert';
import problemService from '../../services/problemService';
import { MAX_PARTICIPANTS } from '../../utils/constants';

const W_LABELS = [
  { min: 0, max: 0.2, label: 'Very Low Agreement', color: 'text-red-700 bg-red-100' },
  { min: 0.2, max: 0.4, label: 'Low Agreement', color: 'text-orange-700 bg-orange-100' },
  { min: 0.4, max: 0.6, label: 'Moderate Agreement', color: 'text-yellow-700 bg-yellow-100' },
  { min: 0.6, max: 0.8, label: 'High Agreement', color: 'text-green-700 bg-green-100' },
  { min: 0.8, max: 1.01, label: 'Very High Agreement', color: 'text-emerald-700 bg-emerald-100' },
];

function getWLabel(w) {
  return W_LABELS.find(l => w >= l.min && w < l.max) || W_LABELS[0];
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/**
 * ParticipantManager – admin panel for managing participants, config, and rounds.
 *
 * Props:
 *   problemId        – current problem ID
 *   config           – { anonymousMode, pinProtection, delphiEnabled }
 *   currentRound     – current round number
 *   roundStatus      – 'open' | 'closed' | 'finalised'
 *   onDataChange     – () => void  – callback to trigger reload of problem data
 */
const ParticipantManager = ({
  problemId,
  config: initialConfig = {},
  currentRound = 1,
  roundStatus: initialRoundStatus = 'open',
  onDataChange,
}) => {
  const [participants, setParticipants] = useState([]);
  const [config, setConfig] = useState({
    anonymousMode: false,
    pinProtection: false,
    delphiEnabled: false,
    ...initialConfig,
  });
  const [roundStatus, setRoundStatus] = useState(initialRoundStatus);
  const [round, setRound] = useState(currentRound);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // Link/PIN display
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkInfo, setLinkInfo] = useState(null);

  // Consensus
  const [consensus, setConsensus] = useState(null);
  const [loadingConsensus, setLoadingConsensus] = useState(false);

  // Rounds
  const [rounds, setRounds] = useState([]);

  // WebSocket
  const wsRef = useRef(null);
  const [wsConnected, setWsConnected] = useState(false);
  const reconnectTimer = useRef(null);

  // Toast
  const [toast, setToast] = useState(null);

  // Sync props
  useEffect(() => {
    setConfig(c => ({ ...c, ...initialConfig }));
    setRoundStatus(initialRoundStatus);
    setRound(currentRound);
  }, [initialConfig, initialRoundStatus, currentRound]);

  // Load participants
  const loadParticipants = useCallback(async () => {
    if (!problemId) return;
    try {
      setLoading(true);
      const data = await problemService.listParticipants(problemId);
      setParticipants(data.participants || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load participants');
    } finally {
      setLoading(false);
    }
  }, [problemId]);

  useEffect(() => { loadParticipants(); }, [loadParticipants]);

  // WebSocket connection
  useEffect(() => {
    if (!problemId) return;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/problems/${problemId}/status`);

      ws.onopen = () => {
        setWsConnected(true);
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
          reconnectTimer.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'participant:completed') {
            const label = msg.name || msg.anonymousLabel || 'A participant';
            setToast(`${label} has submitted their comparisons.`);
            setTimeout(() => setToast(null), 5000);
          }
          // Refresh participants on any event
          loadParticipants();
        } catch { /* ignore invalid messages */ }
      };

      ws.onclose = () => {
        setWsConnected(false);
        wsRef.current = null;
        // Reconnect after 5s
        reconnectTimer.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    };

    connect();

    // Fallback polling when WS is down
    const pollInterval = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        loadParticipants();
      }
    }, 30000);

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      clearInterval(pollInterval);
    };
  }, [problemId, loadParticipants]);

  // ── Actions ──

  const handleAddParticipant = async () => {
    const name = newName.trim();
    if (!name) return;
    setError('');
    try {
      const result = await problemService.addParticipant(problemId, {
        name,
        email: newEmail.trim() || undefined,
      });
      setShowAddModal(false);
      setNewName('');
      setNewEmail('');
      // Show link info
      setLinkInfo({
        name: result.participant.name,
        link: result.participationLink,
        pin: result.pin,
      });
      setShowLinkModal(true);
      loadParticipants();
      onDataChange?.();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to add participant');
    }
  };

  const handleRemove = async (pid) => {
    if (!window.confirm('Remove this participant and all their comparison data?')) return;
    try {
      await problemService.removeParticipant(problemId, pid);
      loadParticipants();
      onDataChange?.();
      setSuccess('Participant removed');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to remove');
    }
  };

  const handleWeightChange = async (pid, weight) => {
    const w = Math.max(0, Math.min(10, parseFloat(weight) || 0));
    // Optimistic update
    setParticipants(prev => prev.map(p => p.id === pid ? { ...p, weight: w } : p));
    try {
      await problemService.updateParticipant(problemId, pid, { weight: w });
      onDataChange?.();
    } catch (err) {
      loadParticipants();
      setError(err.response?.data?.error?.message || 'Failed to update weight');
    }
  };

  const handleResetWeights = async () => {
    try {
      await Promise.all(
        participants.map(p => problemService.updateParticipant(problemId, p.id, { weight: 1 }))
      );
      loadParticipants();
      onDataChange?.();
    } catch {
      setError('Failed to reset weights');
    }
  };

  const handleRegeneratePin = async (pid) => {
    try {
      const result = await problemService.regeneratePin(problemId, pid);
      setLinkInfo({
        name: participants.find(p => p.id === pid)?.name || 'Participant',
        link: result.participationLink,
        pin: result.pin,
      });
      setShowLinkModal(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to regenerate PIN');
    }
  };

  const handleCopyLink = (participant) => {
    const link = `${window.location.origin}/participate/${problemId}/${participant.token}`;
    navigator.clipboard.writeText(link).then(() => {
      setSuccess('Link copied to clipboard');
      setTimeout(() => setSuccess(''), 3000);
    });
  };

  // ── Config toggles ──

  const handleConfigChange = async (key, value) => {
    try {
      await problemService.updateConfig(problemId, { [key]: value });
      setConfig(prev => ({ ...prev, [key]: value }));
      onDataChange?.();
      if (key === 'pinProtection' && value) {
        // Reload to get newly generated PINs
        loadParticipants();
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to update configuration');
    }
  };

  // ── Round management ──

  const handleCloseRound = async () => {
    if (!window.confirm('Close this round? Participants will no longer be able to submit comparisons.')) return;
    try {
      await problemService.closeRound(problemId);
      setRoundStatus('closed');
      onDataChange?.();
      setSuccess('Round closed');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to close round');
    }
  };

  const handleReopenRound = async () => {
    try {
      await problemService.reopenRound(problemId);
      setRoundStatus('open');
      onDataChange?.();
      setSuccess('Round reopened');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to reopen round');
    }
  };

  const handleNewRound = async () => {
    if (!window.confirm('Start a new round? This will allow participants to revise their comparisons.')) return;
    try {
      const result = await problemService.newRound(problemId);
      setRound(result.currentRound);
      setRoundStatus('open');
      onDataChange?.();
      loadParticipants();
      setSuccess(`Round ${result.currentRound} started`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to start new round');
    }
  };

  const handleFinalize = async () => {
    if (!window.confirm('Finalize this problem? No further rounds will be possible. This cannot be undone.')) return;
    try {
      await problemService.finalizeProblem(problemId);
      setRoundStatus('finalised');
      onDataChange?.();
      setSuccess('Problem finalized');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to finalize');
    }
  };

  // ── Consensus ──

  const handleLoadConsensus = async () => {
    setLoadingConsensus(true);
    try {
      const data = await problemService.getConsensus(problemId);
      setConsensus(data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to compute consensus');
    } finally {
      setLoadingConsensus(false);
    }
  };

  // ── Rounds history ──

  const handleLoadRounds = async () => {
    try {
      const data = await problemService.listRounds(problemId);
      setRounds(data.rounds || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load rounds');
    }
  };

  useEffect(() => {
    if (config.delphiEnabled && problemId) {
      handleLoadRounds();
    }
  }, [config.delphiEnabled, problemId]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalWeight = participants.reduce((s, p) => s + (p.weight || 1), 0);
  const completedCount = participants.filter(p => p.status === 'completed').length;
  const isFinalised = roundStatus === 'finalised';

  return (
    <div>
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse">
          {toast}
        </div>
      )}

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-nyu-text-primary">Participants</h3>
          <p className="text-sm text-nyu-text-secondary">
            Add participants and share unique participation links.
            {!wsConnected && (
              <span className="ml-2 text-amber-600 text-xs">(live updates unavailable)</span>
            )}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowAddModal(true)}
          disabled={participants.length >= MAX_PARTICIPANTS || isFinalised}
        >
          + Add Participant
        </Button>
      </div>

      {/* Configuration toggles */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-semibold text-nyu-text-primary mb-3">Problem Configuration</h4>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={config.anonymousMode}
              onChange={e => handleConfigChange('anonymousMode', e.target.checked)}
              disabled={isFinalised}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span>Anonymous Mode</span>
            {config.anonymousMode && (
              <span className="text-xs text-gray-500">(locked once a participant begins)</span>
            )}
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={config.pinProtection}
              onChange={e => handleConfigChange('pinProtection', e.target.checked)}
              disabled={isFinalised}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span>PIN Protection</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={config.delphiEnabled}
              onChange={e => handleConfigChange('delphiEnabled', e.target.checked)}
              disabled={isFinalised}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span>Delphi Iteration</span>
          </label>
        </div>
      </div>

      {/* Round controls (Delphi mode or when multiple rounds exist) */}
      {(config.delphiEnabled || round > 1) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-blue-800">Round {round}</span>
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                roundStatus === 'open' ? 'bg-green-100 text-green-700' :
                roundStatus === 'closed' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-200 text-gray-600'
              }`}>
                {roundStatus === 'finalised' ? 'Finalised' : roundStatus.charAt(0).toUpperCase() + roundStatus.slice(1)}
              </span>
            </div>
            <div className="flex gap-2">
              {roundStatus === 'open' && !isFinalised && (
                <Button size="sm" variant="outline" onClick={handleCloseRound}>Close Round</Button>
              )}
              {roundStatus === 'closed' && !isFinalised && (
                <>
                  <Button size="sm" variant="outline" onClick={handleReopenRound}>Reopen</Button>
                  <Button size="sm" onClick={handleNewRound}>New Round</Button>
                  <Button size="sm" variant="outline" onClick={handleFinalize}>Finalize</Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Participants table */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700 mx-auto" />
        </div>
      ) : participants.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-nyu-text-secondary mb-2">No participants added yet.</p>
          <p className="text-sm text-gray-400">
            Add up to {MAX_PARTICIPANTS} participants to gather multiple perspectives.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {participants.map((p) => {
            const normalizedWeight = totalWeight > 0 ? ((p.weight / totalWeight) * 100).toFixed(1) : '0.0';
            return (
              <div
                key={p.id}
                className={`border rounded-lg p-4 transition-all ${
                  p.status === 'completed' ? 'border-green-200 bg-green-50' :
                  p.status === 'in-progress' ? 'border-blue-200 bg-blue-50' :
                  'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-nyu-text-primary truncate">
                        {config.anonymousMode ? p.anonymousLabel : p.name}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        p.status === 'completed' ? 'bg-green-100 text-green-700' :
                        p.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {p.status === 'completed' ? 'Completed' :
                         p.status === 'in-progress' ? 'In Progress' : 'Not Started'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-nyu-text-secondary">
                      <span>
                        Weight:
                        <input
                          type="number"
                          min={0}
                          max={10}
                          step={0.1}
                          value={p.weight}
                          onChange={e => handleWeightChange(p.id, e.target.value)}
                          disabled={isFinalised}
                          className="w-14 ml-1 text-xs border rounded px-1 py-0.5"
                        />
                        <span className="ml-1 text-gray-400">({normalizedWeight}%)</span>
                      </span>
                      {p.lastActivity && <span>Last: {formatDate(p.lastActivity)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleCopyLink(p)}
                      className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors"
                      title="Copy participation link"
                    >
                      Copy Link
                    </button>
                    {config.pinProtection && (
                      <button
                        onClick={() => handleRegeneratePin(p.id)}
                        className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded hover:bg-amber-200 transition-colors"
                        title="Regenerate PIN"
                      >
                        PIN
                      </button>
                    )}
                    {!isFinalised && (
                      <button
                        onClick={() => handleRemove(p.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium ml-1"
                        title="Remove"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-nyu-text-secondary">
          {participants.length}/{MAX_PARTICIPANTS} participants
          {completedCount > 0 && ` · ${completedCount} completed`}
        </p>
        {participants.length > 1 && !isFinalised && (
          <button
            onClick={handleResetWeights}
            className="text-xs text-purple-600 hover:underline"
          >
            Reset to Equal Weights
          </button>
        )}
      </div>

      {/* Consensus section */}
      {completedCount >= 2 && (
        <div className="mt-6 border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-nyu-text-primary">Consensus (Kendall's W)</h4>
            <Button size="sm" variant="outline" onClick={handleLoadConsensus} disabled={loadingConsensus}>
              {loadingConsensus ? 'Computing...' : consensus ? 'Refresh' : 'Compute'}
            </Button>
          </div>
          {consensus && (
            <div className="space-y-3">
              {consensus.criteria && (
                <ConsensusRow label="Main Criteria" data={consensus.criteria} />
              )}
              {consensus.alternatives && Object.entries(consensus.alternatives).map(([crit, data]) => (
                <ConsensusRow key={crit} label={`Alternatives w.r.t. ${crit}`} data={data} />
              ))}
              {consensus.global && (
                <ConsensusRow label="Global Alternatives" data={consensus.global} />
              )}
            </div>
          )}
        </div>
      )}

      {/* Round history (Delphi) */}
      {config.delphiEnabled && rounds.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <h4 className="text-lg font-semibold text-nyu-text-primary mb-3">Round History</h4>
          <div className="space-y-2">
            {rounds.map(r => (
              <div key={r.roundNumber} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2 text-sm">
                <span className="font-medium">Round {r.roundNumber}</span>
                <span className="text-gray-500">{formatDate(r.openedAt)} — {formatDate(r.closedAt)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  r.status === 'closed' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                }`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add participant modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setNewName(''); setNewEmail(''); }}
        title="Add Participant"
        footer={
          <>
            <Button variant="outline" onClick={() => { setShowAddModal(false); setNewName(''); setNewEmail(''); }}>Cancel</Button>
            <Button onClick={handleAddParticipant} disabled={!newName.trim()}>Add</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-nyu-text-primary mb-1">Name *</label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddParticipant()}
              className="input w-full"
              placeholder="e.g., Dr. Smith"
              maxLength={60}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-nyu-text-primary mb-1">Email (optional)</label>
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              className="input w-full"
              placeholder="e.g., smith@example.com"
              maxLength={100}
            />
            <p className="text-xs text-gray-400 mt-1">Stored for your reference only — the system does not send emails.</p>
          </div>
        </div>
      </Modal>

      {/* Link/PIN display modal */}
      <Modal
        isOpen={showLinkModal}
        onClose={() => { setShowLinkModal(false); setLinkInfo(null); }}
        title="Participation Link"
        footer={
          <Button onClick={() => { setShowLinkModal(false); setLinkInfo(null); }}>Done</Button>
        }
      >
        {linkInfo && (
          <div className="space-y-4">
            <p className="text-sm text-nyu-text-secondary">
              Share the following link with <strong>{linkInfo.name}</strong>:
            </p>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Participation Link</p>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-white border rounded px-2 py-1 flex-1 break-all">{linkInfo.link}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(linkInfo.link);
                    setSuccess('Link copied');
                    setTimeout(() => setSuccess(''), 3000);
                  }}
                  className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded hover:bg-purple-200"
                >
                  Copy
                </button>
              </div>
            </div>
            {linkInfo.pin && (
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">PIN</p>
                <div className="flex items-center gap-2">
                  <code className="text-2xl font-bold tracking-widest">{linkInfo.pin}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(linkInfo.pin);
                      setSuccess('PIN copied');
                      setTimeout(() => setSuccess(''), 3000);
                    }}
                    className="text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded hover:bg-amber-200"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-amber-600 mt-1">Share this PIN securely with the participant.</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

/** Small sub-component to display a Kendall's W result row */
const ConsensusRow = ({ label, data }) => {
  if (!data || data.W === undefined) return null;
  const wInfo = getWLabel(data.W);
  return (
    <div className="bg-gray-50 rounded-lg px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-nyu-text-primary">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">W = {data.W.toFixed(3)}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${wInfo.color}`}>{wInfo.label}</span>
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        χ² = {data.chiSquared?.toFixed(2)} · p = {data.pValue?.toFixed(4)}
        {data.k && ` · k=${data.k} judges`}
        {data.n && `, n=${data.n} items`}
      </div>
    </div>
  );
};

export default ParticipantManager;
