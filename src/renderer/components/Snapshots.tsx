import { useState } from 'react'
import { useStudio } from '../state/store'
import { drawThumbnail } from '../engine/render'

export function Snapshots(): JSX.Element {
  const snapshots = useStudio((s) => s.snapshots)
  const addSnapshot = useStudio((s) => s.addSnapshot)
  const removeSnapshot = useStudio((s) => s.removeSnapshot)
  const loadSnapshot = useStudio((s) => s.loadSnapshot)
  const replaying = useStudio((s) => s.replaying)
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')

  const capture = async (): Promise<void> => {
    const s = useStudio.getState()
    const thumb = drawThumbnail(s.engine.glass, s.engine.input, s.metrics)
    const n = snapshots.length + 1
    // 保存失败时保留已填内容，便于重试
    const ok = await addSnapshot(title.trim() || `工序 ${n}`, note.trim(), thumb)
    if (ok) {
      setTitle('')
      setNote('')
    }
  }

  return (
    <div className="panel snapshots">
      <h3>过程快照</h3>
      <div className="snap-form">
        <input
          value={title}
          maxLength={30}
          placeholder="节点名称（可选）"
          onChange={(ev) => setTitle(ev.target.value)}
          disabled={replaying}
        />
        <button className="primary" onClick={capture} disabled={replaying}>
          拍快照
        </button>
      </div>
      <input
        className="snap-note-input"
        value={note}
        maxLength={60}
        placeholder="工序备注（可选，如：鼓腹完成、开始收颈）"
        onChange={(ev) => setNote(ev.target.value)}
        disabled={replaying}
      />
      {snapshots.length === 0 && <p className="muted small">还没有快照，在关键工序节点拍一张。</p>}
      <ul className="snap-list">
        {snapshots.map((meta) => (
          <li key={meta.record.id}>
            <img src={meta.record.thumb} alt={meta.record.title} />
            <div className="snap-info">
              <b>{meta.record.title}</b>
              {meta.record.note && <span className="snap-note">{meta.record.note}</span>}
              <span className="snap-statusline">
                <i className={`snap-badge ${meta.summary.tone}`}>{meta.summary.status}</i>
                {meta.summary.temp}℃ · 伸长×{meta.summary.elongation.toFixed(2)}
              </span>
              {meta.summary.warnings.length > 0 && (
                <span className="snap-warn">{meta.summary.warnings.join(' · ')}</span>
              )}
              <span>{new Date(meta.record.created_at).toLocaleTimeString()}</span>
              <div className="snap-actions">
                <button disabled={replaying} onClick={() => loadSnapshot(meta)}>
                  读取
                </button>
                <button
                  className="danger-btn"
                  onClick={() => meta.record.id != null && removeSnapshot(meta.record.id)}
                >
                  删除
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="muted small">删除后 6 秒内可从提示条撤销。</p>
    </div>
  )
}

export function Timeline(): JSX.Element {
  const replaying = useStudio((s) => s.replaying)
  const progress = useStudio((s) => s.replayProgress)
  const playReplay = useStudio((s) => s.playReplay)
  const stopReplay = useStudio((s) => s.stopReplay)
  const resetGlass = useStudio((s) => s.resetGlass)
  const exportTrajectory = useStudio((s) => s.exportTrajectory)
  const importTrajectory = useStudio((s) => s.importTrajectory)
  const engine = useStudio((s) => s.engine)
  const frames = engine.traj.length

  return (
    <div className="panel timeline">
      <h3>成形轨迹</h3>
      <div className="timeline-btns">
        {!replaying ? (
          <button className="primary" onClick={playReplay} disabled={frames < 2}>
            ▶ 回放轨迹
          </button>
        ) : (
          <button onClick={stopReplay}>■ 停止回放</button>
        )}
        <button onClick={resetGlass} disabled={replaying}>
          ↺ 取新料重来
        </button>
      </div>
      <div className="timeline-btns">
        <button onClick={() => void exportTrajectory()} disabled={replaying || frames < 2}>
          ⤓ 导出轨迹
        </button>
        <button onClick={() => void importTrajectory()} disabled={replaying}>
          ⤒ 导入轨迹
        </button>
      </div>
      <div className="bar">
        <i style={{ width: `${(replaying ? progress : frames > 0 ? 1 : 0) * 100}%` }} />
      </div>
      <p className="muted small">
        {replaying
          ? `回放中 ${(progress * 100).toFixed(0)}%（从料泡开始逐帧复现）`
          : `已记录 ${frames} 帧（约 ${(frames / 30).toFixed(1)} 秒操作）· 可导出为 JSON，导入后从料泡重新回放`}
      </p>
    </div>
  )
}
