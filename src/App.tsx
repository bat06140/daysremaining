import { useRef } from "react";

import tw from "twin.macro";
import Calendar from "./Calendar";

function  App() {
  const parentRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={parentRef} css={tw`w-full h-full`}>
      <Calendar />
    </div>
  );
}

export default App;
