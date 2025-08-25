import { useEffect, useRef, useState } from "react";
import tw from "twin.macro";
import Calendar from "./components/Calendar";
import { DaysRemaining } from "./components/DaysRemaining";
import FlipClock from "./components/FlipClock";

const components = {
  calendar: Calendar,
  daysRemaining: DaysRemaining,
  clock: FlipClock,
};

function App() {
  const [isClient, setIsClient] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  const componentName = import.meta.env.VITE_COMPONENT || "calendar";
  const Component = components[componentName as keyof typeof components];

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div
      ref={parentRef}
      css={tw`w-screen h-screen flex items-center justify-center`}
    >
      {isClient ? <Component /> : "Loading..."}
    </div>
  );
}

export default App;
