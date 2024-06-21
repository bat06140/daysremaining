import { useRef } from "react";

import tw from "twin.macro";
import Calendar from "./Calendar";
import { DaysRemaining } from "./DaysRemaining";

function App() {
  const parentRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={parentRef} css={tw`h-screen`}>
      <DaysRemaining />
      {/* <Calendar /> */}
    </div>
  );
}

export default App;
