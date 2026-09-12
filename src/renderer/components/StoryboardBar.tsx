import { useState } from 'react'
import { useStudio } from '../state/store'
import { drawThumbnail } from '../engine/render'
import { restoreGlass } from '../engine/geometry'
import { DEFAULT_INPUT, measure } from '../engine/engine'
import { describeGlass } from '../engine/describe'
import { exportStoryboard, saveStoryboardFile } from '../state/storage'

export function StoryboardBar(): JSX.Element {
  const snapshots = useStudio((s) => s.snapshots)
  const busy = useStudio((s) => s.busy)
  const setBusy = useStudio((s) => s.setBusy)
  const showToast = useStudio((s) => s.showToast)
  const [title, setTitle] = useState('我的花瓶')

  const exportBoard = async (): Promise<void> => {
    if (snapshots.length === 0) {
      showToast('先拍几张过程快照再导出分镜')
      return
    }
    setBusy(true)
    try {
      const panels = snapshots.map((meta) => {
        const glass = restoreGlass(meta.snapshot)
        return {
          title: meta.record.title,
          caption: meta.record.note || describeGlass(glass),
          thumb: drawThumbnail(glass, DEFAULT_INPUT, measure(glass))
        }
      })
      const dataUrl = await exportStoryboard(panels, title)
      const name = `${title || 'glass-storyboard'}.png`
      const path = await saveStoryboardFile(dataUrl, name)
      showToast(`分镜已导出：${path}`)
    } catch (err) {
      showToast(`导出失败：${(err as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="panel storyboard">
      <h3>制作分镜</h3>
      <div className="snap-form">
        <input value={title} onChange={(ev) => setTitle(ev.target.value)} placeholder="作品名" />
        <button className="primary" onClick={exportBoard} disabled={busy || snapshots.length === 0}>
          {busy ? '合成中…' : '导出分镜 PNG'}
        </button>
      </div>
      <p className="muted small">按快照时间线自动排版成带编号与状态注记的工序分镜。</p>
    </div>
  )
}
