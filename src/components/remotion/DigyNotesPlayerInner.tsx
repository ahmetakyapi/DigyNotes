"use client";

import { Player } from "@remotion/player";
import { DigyNotesIntro } from "./DigyNotesIntro";

type Props = { readonly theme?: "dark" | "light" };

export default function DigyNotesPlayerInner({ theme = "dark" }: Props) {
  return (
    <Player
      component={DigyNotesIntro}
      inputProps={{ theme }}
      durationInFrames={840}
      compositionWidth={640}
      compositionHeight={480}
      fps={30}
      loop
      autoPlay
      controls={false}
      style={{ width: "100%", display: "block" }}
    />
  );
}
