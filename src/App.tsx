import { useState, useEffect, useRef } from 'react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

import { DropZone } from '@/features/playlist/components/DropZone/DropZone';
import { SongCard } from '@/features/playlist/components/SongCard/SongCard';
import { ExportPanel } from '@/features/export/components/ExportPanel/ExportPanel';
import { UpgradeModal } from '@/features/billing/components/UpgradeModal/UpgradeModal';
import { AuthBar } from '@/features/billing/components/AuthBar/AuthBar';
import { SurveyModal } from '@/features/survey/components/SurveyModal/SurveyModal';

import { usePlaylist } from '@/features/playlist/hooks/usePlaylist';
import { useExport } from '@/features/export/hooks/useExport';
import { usePlan } from '@/features/billing/hooks/usePlan';
import { useSurvey } from '@/features/survey/hooks/useSurvey';

import { formatTime, parseTime } from '@/features/export/lib/audio';
import { FREE_LIMIT } from '@/features/billing/constants';
import { PaymentReturnSchema } from '@/features/billing/schemas';

import styles from './App.module.css';

export default function App() {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { isPro, loading: planLoading } = usePlan();
  const { songs, audioBuffers, addFiles, updateSong, removeSong, reorder, playingId, setPlayingId } = usePlaylist();
  const { status, progress, exportPlaylist, notifyPaymentReturn, exportsUsed } = useExport(
    songs,
    audioBuffers,
    isPro,
    () => setShowUpgrade(true),
  );
  const { isVisible: showSurvey, submitted: surveySubmitted, submitting: surveySubmitting, triggerAfterExport, dismiss: dismissSurvey, submit: submitSurvey } = useSurvey();

  const prevStatusType = useRef(status.type);
  useEffect(() => {
    if (status.type === 'loading' && prevStatusType.current !== 'loading') {
      triggerAfterExport();
    }
    prevStatusType.current = status.type;
  }, [status.type, triggerAfterExport]);

  useEffect(() => {
    const raw = Object.fromEntries(new URLSearchParams(window.location.search));
    const result = PaymentReturnSchema.safeParse(raw);
    if (result.success && result.data.payment) {
      notifyPaymentReturn(result.data.payment);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [notifyPaymentReturn]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const totalDuration = songs.reduce((acc, s) => {
    const st = parseTime(s.startTime);
    const en = s.endTime ? parseTime(s.endTime) : s.duration;
    return acc + Math.max(0, en - st);
  }, 0);

  const overLimit = !isPro && songs.length > FREE_LIMIT;

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}><HeadphonesIcon /></div>
          <div>
            <div className={styles.logoTitle}>Mixmoments</div>
            <div className={styles.logoSub}>playlist builder</div>
          </div>
        </div>

        <div className={styles.sideStats}>
          <div className={styles.stat}>
            <span className={styles.statVal}>{songs.length}</span>
            <span className={styles.statLabel}>tracks</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statVal}>{totalDuration > 0 ? formatTime(totalDuration) : '—'}</span>
            <span className={styles.statLabel}>duration</span>
          </div>
        </div>

        {!planLoading && (
          <div className={styles.planStatus}>
            {isPro ? (
              <span className={styles.planPro}>✦ Lifetime unlocked</span>
            ) : (
              <span className={styles.planFree}>
                {songs.length} / {FREE_LIMIT} free songs
                {/* {overLimit && (
                  <button className={styles.upgradeLink} onClick={() => setShowUpgrade(true)}>
                    Upgrade → 
                  </button>
                )} */}
                {overLimit && (
                  <span className={styles.upgradeLink}>Songs beyond 10 are locked</span>
                )}
              </span>
            )}
          </div>
        )}

        <div className={styles.sideNote}>Files stay in your browser.<br />Nothing is uploaded.</div>
      </aside>

      <main className={styles.main}>
        <div className={styles.topBar}>
          <div>
            <h1 className={styles.pageTitle}>Build your event playlist</h1>
            <p className={styles.pageSubtitle}>Load songs, set trim points, configure fades, export as one MP3. (Max 10 songs)</p>
          </div>
          {/* <AuthBar isPro={isPro} /> */}
        </div>

        <section className={styles.section}>
          <div className={styles.stepLabel}>01 — Add songs</div>
          <DropZone onFiles={addFiles} />
        </section>

        {songs.length > 0 && (
          <section className={styles.section}>
            <div className={styles.stepLabel}>02 — Arrange & configure</div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={reorder}
            >
              <SortableContext items={songs.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div className={styles.songList}>
                  {songs.map((song, idx) => (
                    <SongCard
                      key={song.id}
                      song={song}
                      index={idx}
                      total={songs.length}
                      onChange={updateSong}
                      onRemove={removeSong}
                      locked={!isPro && idx >= FREE_LIMIT}
                      onUpgrade={() => setShowUpgrade(true)}
                      isPlaying={playingId === song.id}
                      onPlay={setPlayingId}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {overLimit && (
              <div className={styles.limitBanner}>
                Songs beyond {FREE_LIMIT} are locked.{' '}
                {/* <button className={styles.limitBannerBtn} onClick={() => setShowUpgrade(true)}>
                  Unlock unlimited →
                </button> */}
              </div>
            )}
          </section>
        )}

        <section className={styles.section}>
          <div className={styles.stepLabel}>03 — Export</div>
          <ExportPanel
            songs={songs}
            status={status}
            progress={progress}
            onExport={exportPlaylist}
            isPro={isPro}
            exportsUsed={exportsUsed}
          />
        </section>
      </main>

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
      {showSurvey && (
        <SurveyModal
          submitted={surveySubmitted}
          submitting={surveySubmitting}
          onSubmit={submitSurvey}
          onClose={dismissSurvey}
        />
      )}
    </div>
  );
}

function HeadphonesIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M3 14v-3a8 8 0 0 1 16 0v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <rect x="1.5" y="13" width="4" height="6" rx="2" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="16.5" y="13" width="4" height="6" rx="2" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  );
}
