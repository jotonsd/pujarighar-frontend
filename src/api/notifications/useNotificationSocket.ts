import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { baseApi } from "@/api/baseApi";
import { wsAuthedUrl } from "@/lib/ws";
import { AppNotification } from "./notificationsApi";

type WsMessage = { type: "notification"; notification: AppNotification };

export function useNotificationSocket(enabled: boolean, playSound: boolean) {
  const dispatch = useDispatch();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (playSound && !audioRef.current) {
      audioRef.current = new Audio("/assets/notification/notification.wav");
    }
  }, [playSound]);

  // Browsers block audio autoplay until the page has had a real user gesture.
  // An admin dashboard left open without a click would otherwise never get
  // sound and fail silently — so "unlock" playback on the first click/keypress.
  useEffect(() => {
    if (!playSound) return;

    const unlock = () => {
      const audio = audioRef.current;
      if (audio) {
        audio.play().then(() => {
          audio.pause();
          audio.currentTime = 0;
        }).catch(() => {});
      }
    };

    document.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });
    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, [playSound]);

  useEffect(() => {
    if (!enabled) return;

    const ws = new WebSocket(wsAuthedUrl("/ws/notifications/"));

    ws.onmessage = event => {
      const data: WsMessage = JSON.parse(event.data);
      if (data.type !== "notification") return;

      dispatch(baseApi.util.invalidateTags(["Notifications"]));

      if (playSound) {
        audioRef.current?.play().catch(err => {
          console.warn("Notification sound blocked by the browser:", err);
        });
      }
    };

    return () => ws.close();
  }, [enabled, playSound, dispatch]);
}
