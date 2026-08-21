import { ParticipantView, useCallStateHooks } from '@stream-io/video-react-sdk'

const MediaTile = ({ className, participant, fallbackText, title, role }) => (
  <section className={`whatsapp-call__tile ${className}`}>
    {participant ? (
      <ParticipantView participant={participant} />
    ) : (
      <div className="whatsapp-call__waiting">
        <div className="whatsapp-call__avatar">{title?.charAt(0)?.toUpperCase() || '?'}</div>
        <strong>{title}</strong>
        <span>{fallbackText}</span>
      </div>
    )}
    <div className="whatsapp-call__name">
      <span>{title}</span>
      <small>{role}</small>
    </div>
  </section>
)

const WhatsAppVideoCall = ({ onEndCall, remoteRole, localRole, remoteFallback }) => {
  const { useCallCallingState, useParticipants, useMicrophoneState, useCameraState } = useCallStateHooks()
  const callingState = useCallCallingState()
  const participants = useParticipants()
  const micState = useMicrophoneState()
  const cameraState = useCameraState()

  if (callingState !== 'joined') {
    return (
      <div className="whatsapp-call whatsapp-call--joining">
        <div className="whatsapp-call__joining-content">
          <div className="spinner-border text-light" role="status" aria-label="Joining video call" />
          <p>Joining call…</p>
        </div>
      </div>
    )
  }

  const localParticipant = participants.find((participant) => participant.isLocalParticipant)
  const remoteParticipant = participants.find((participant) => !participant.isLocalParticipant) || null
  const getName = (participant, fallback) => participant?.user?.name || participant?.name || fallback
  const remoteName = getName(remoteParticipant, remoteRole)
  const localName = getName(localParticipant, 'You')

  const toggleMic = async () => {
    if (micState.microphone.enabled) await micState.microphone.disable()
    else await micState.microphone.enable()
  }

  const toggleCamera = async () => {
    if (cameraState.camera.enabled) await cameraState.camera.disable()
    else await cameraState.camera.enable()
  }

  return (
    <div className="whatsapp-call">
      <style>{`
        .whatsapp-call { position: fixed; inset: 0; z-index: 2000; min-height: 100svh; min-height: 100dvh; background: #101418; color: #fff; overflow: hidden; isolation: isolate; font-family: inherit; }
        .whatsapp-call--joining { display: grid; place-items: center; background: radial-gradient(circle at center, #253932 0%, #101817 65%); }
        .whatsapp-call__joining-content { display: grid; justify-items: center; gap: 16px; color: #fff; }
        .whatsapp-call__stage { position: relative; height: 100svh; height: 100dvh; width: 100%; min-height: 100vh; background: #202c33; }
        .whatsapp-call__tile { position: relative; overflow: hidden; background: #263238; }
        .whatsapp-call__tile .str-video__participant-view,
        .whatsapp-call__tile .str-video__participant-view video,
        .whatsapp-call__tile .str-video__participant-view iframe { width: 100% !important; height: 100% !important; max-width: none !important; object-fit: cover !important; }
        .whatsapp-call__tile .str-video__participant-view { display: block; background: #263238; }
        .whatsapp-call__remote { position: absolute; inset: 0; border-radius: 0; }
        .whatsapp-call__remote::after { content: ''; position: absolute; inset: auto 0 0; height: 34%; pointer-events: none; background: linear-gradient(transparent, rgba(0,0,0,.46)); }
        .whatsapp-call__local { position: absolute; top: max(76px, calc(env(safe-area-inset-top) + 56px)); right: max(12px, env(safe-area-inset-right)); z-index: 3; width: clamp(104px, 30vw, 154px); aspect-ratio: 3 / 4; border: 2px solid rgba(255,255,255,.92); border-radius: 16px; box-shadow: 0 10px 28px rgba(0,0,0,.52); background: #37474f; }
        .whatsapp-call__waiting { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 24px; text-align: center; color: rgba(255,255,255,.92); }
        .whatsapp-call__waiting span { color: rgba(255,255,255,.7); font-size: 14px; }
        .whatsapp-call__avatar { display: grid; place-items: center; width: 76px; aspect-ratio: 1; border-radius: 50%; background: #00a884; font-size: 30px; font-weight: 700; }
        .whatsapp-call__name { position: absolute; left: 14px; right: 14px; bottom: 16px; z-index: 2; display: flex; flex-direction: column; gap: 2px; text-shadow: 0 1px 4px #000; pointer-events: none; }
        .whatsapp-call__local .whatsapp-call__name { right: 8px; bottom: 8px; left: 8px; }
        .whatsapp-call__name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 15px; font-weight: 700; }
        .whatsapp-call__name small { color: rgba(255,255,255,.78); font-size: 12px; }
        .whatsapp-call__header { position: absolute; inset: 0 0 auto; z-index: 4; display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: max(18px, env(safe-area-inset-top)) max(18px, env(safe-area-inset-right)) 56px max(18px, env(safe-area-inset-left)); background: linear-gradient(180deg, rgba(0,0,0,.74), rgba(0,0,0,.28) 55%, transparent); pointer-events: none; }
        .whatsapp-call__header strong { display: block; overflow: hidden; max-width: 62vw; text-overflow: ellipsis; white-space: nowrap; font-size: 17px; line-height: 1.35; }
        .whatsapp-call__header span { color: rgba(255,255,255,.82); font-size: 13px; }
        .whatsapp-call__status { display: flex; flex-shrink: 0; align-items: center; gap: 7px; padding: 5px 9px; border-radius: 999px; background: rgba(0,0,0,.26); color: rgba(255,255,255,.9); font-size: 12px; }
        .whatsapp-call__status::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: #25d366; box-shadow: 0 0 0 3px rgba(37,211,102,.18); }
        .whatsapp-call__controls { position: absolute; z-index: 4; right: 0; bottom: 0; left: 0; display: flex; justify-content: center; align-items: center; gap: clamp(18px, 8vw, 36px); padding: 52px max(20px, env(safe-area-inset-right)) max(26px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left)); background: linear-gradient(0deg, rgba(0,0,0,.9), rgba(0,0,0,.42) 44%, transparent); }
        .whatsapp-call__button { display: grid; place-items: center; width: 58px; min-width: 58px; aspect-ratio: 1; border: 0; border-radius: 50%; background: rgba(255,255,255,.22); color: #fff; font-size: 21px; box-shadow: 0 4px 14px rgba(0,0,0,.2); transition: transform .15s ease, background .15s ease; touch-action: manipulation; }
        .whatsapp-call__button:hover { transform: scale(1.06); background: rgba(255,255,255,.34); }
        .whatsapp-call__button:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }
        .whatsapp-call__button--disabled { background: #d9404e; }
        .whatsapp-call__button--end { width: 70px; min-width: 70px; background: #ea4d57; font-size: 25px; }
        @media (min-width: 768px) { .whatsapp-call__local { top: max(84px, calc(env(safe-area-inset-top) + 64px)); right: 28px; width: min(22vw, 282px); border-radius: 18px; } .whatsapp-call__header { padding-right: 28px; padding-left: 28px; } .whatsapp-call__controls { padding-bottom: 34px; } }
        @media (max-width: 380px) { .whatsapp-call__local { top: max(68px, calc(env(safe-area-inset-top) + 50px)); width: 104px; right: 10px; } .whatsapp-call__button { width: 54px; min-width: 54px; font-size: 19px; } .whatsapp-call__button--end { width: 64px; min-width: 64px; } .whatsapp-call__controls { gap: 15px; padding-top: 44px; } }
        @media (max-height: 520px) and (orientation: landscape) { .whatsapp-call__local { top: 16px; width: 108px; } .whatsapp-call__header { padding-top: 14px; padding-bottom: 36px; } .whatsapp-call__controls { padding-top: 26px; padding-bottom: 16px; } .whatsapp-call__button { width: 50px; min-width: 50px; font-size: 18px; } .whatsapp-call__button--end { width: 58px; min-width: 58px; } }
      `}</style>
      <main className="whatsapp-call__stage">
        <MediaTile className="whatsapp-call__remote" participant={remoteParticipant} fallbackText={remoteFallback} title={remoteName} role={remoteRole} />
        <MediaTile className="whatsapp-call__local" participant={localParticipant} fallbackText="Starting your camera…" title={localName} role={localRole} />
        <header className="whatsapp-call__header">
          <div><strong>{remoteName}</strong><span>Video consultation</span></div>
          <div className="whatsapp-call__status">Connected</div>
        </header>
        <footer className="whatsapp-call__controls" aria-label="Call controls">
          <button className={`whatsapp-call__button ${micState.microphone.enabled ? '' : 'whatsapp-call__button--disabled'}`} onClick={toggleMic} title={micState.microphone.enabled ? 'Mute microphone' : 'Unmute microphone'} aria-label={micState.microphone.enabled ? 'Mute microphone' : 'Unmute microphone'}>
            <i className={`fa-solid ${micState.microphone.enabled ? 'fa-microphone' : 'fa-microphone-slash'}`} />
          </button>
          <button className="whatsapp-call__button whatsapp-call__button--end" onClick={onEndCall} title="End call" aria-label="End call"><i className="fa-solid fa-phone-slash" /></button>
          <button className={`whatsapp-call__button ${cameraState.camera.enabled ? '' : 'whatsapp-call__button--disabled'}`} onClick={toggleCamera} title={cameraState.camera.enabled ? 'Turn camera off' : 'Turn camera on'} aria-label={cameraState.camera.enabled ? 'Turn camera off' : 'Turn camera on'}>
            <i className={`fa-solid ${cameraState.camera.enabled ? 'fa-video' : 'fa-video-slash'}`} />
          </button>
        </footer>
      </main>
    </div>
  )
}

export default WhatsAppVideoCall
