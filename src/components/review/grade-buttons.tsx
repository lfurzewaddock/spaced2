import BouncyButton from '@/components/bouncy-button';
import { Kbd } from '@/components/ui/kbd';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    HOLD_TO_CANCEL_THRESHOLD_MS,
    RATING_TO_KEY,
    RATING_TO_NAME,
} from '@/lib/card-mapping';
import { cn, isEventTargetInput } from '@/lib/utils';
import { intlFormatDistance } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { Card, FSRS, Grade, Rating } from 'ts-fsrs';

type GradeButtonsProps = {
  onGrade: (grade: Grade) => void;
  card: Card;
};

function GradeButton({
  grade,
  onGrade,
  dateString,
}: {
  grade: Grade;
  onGrade: (grade: Grade) => void;
  dateString: string;
}) {
  const key = RATING_TO_KEY[grade] ?? '';
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pressed, setPressed] = useState<boolean | undefined>(undefined);
  const [timePressed, setTimePressed] = useState(0);

  // Allow for "cancelling the press" by holding the key down for a while
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEventTargetInput(e)) return;
      if (e.repeat) return;
      if (e.key === key) {
        setPressed(true);
        setTimePressed(Date.now());
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [grade, key, onGrade]);

  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (isEventTargetInput(e)) return;
      if (e.key === key) {
        if (Date.now() - timePressed < HOLD_TO_CANCEL_THRESHOLD_MS) {
          onGrade(grade);
        }

        setPressed(false);
      }
    };
    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  }, [grade, key, onGrade, timePressed]);

  return (
    <TooltipProvider key={grade} delayDuration={300}>
      <Tooltip>
        {/* Pretty hacky way of handling the presses, will probably need to refactor the BouncyButton */}
        <TooltipTrigger
          ref={buttonRef}
          onMouseDown={() => setPressed(undefined)}
          onClick={() => {
            onGrade(grade);
          }}
          className='flex-1'
        >
          <BouncyButton
            className={cn(
              'flex w-full flex-col justify-center gap-0 transition h-14 text-muted-foreground font-semibold border rounded-none group bg-primary relative'
            )}
            pressed={pressed}
          >
            <div className='absolute bottom-1 left-1 font-semibold text-base sm:text-sm uppercase text-background tracking-widest'>
              {RATING_TO_NAME[grade]}
            </div>
            <div className='absolute top-0 right-2 text-sm text-background'>
              {grade}
              {/* {dateString} */}
            </div>
          </BouncyButton>
        </TooltipTrigger>
        <TooltipContent className='flex items-center' sideOffset={8}>
          <Kbd className='text-md mr-2 text-background'>{key}</Kbd>
          <p>{dateString}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * The buttons to rate a flashcard.
 */
export default function DesktopGradeButtons({
  onGrade,
  card,
}: GradeButtonsProps) {
  const f = new FSRS({});
  const schedulingCards = f.repeat(card, new Date());

  return (
    <div
      className={cn(
        'flex h-full gap-x-1 w-[36vw] grid-cols-4 bg-background dark:bg-muted dark:border-muted-foreground/30 dark:border p-1 rounded-none mt-12 shadow-md'
      )}
      style={{
        transform: `perspective(1000px) rotateX(24deg)`,
      }}
    >
      <GradeButton
        key={Rating.Again}
        grade={Rating.Again}
        onGrade={() => onGrade(Rating.Again)}
        dateString={intlFormatDistance(
          schedulingCards[Rating.Again].card.due,
          new Date()
        )}
      />

      <GradeButton
        key={Rating.Hard}
        grade={Rating.Hard}
        onGrade={() => onGrade(Rating.Hard)}
        dateString={intlFormatDistance(
          schedulingCards[Rating.Hard].card.due,
          new Date()
        )}
      />

      <GradeButton
        key={Rating.Good}
        grade={Rating.Good}
        onGrade={() => onGrade(Rating.Good)}
        dateString={intlFormatDistance(
          schedulingCards[Rating.Good].card.due,
          new Date()
        )}
      />

      <GradeButton
        key={Rating.Easy}
        grade={Rating.Easy}
        onGrade={() => onGrade(Rating.Easy)}
        dateString={intlFormatDistance(
          schedulingCards[Rating.Easy].card.due,
          new Date()
        )}
      />
    </div>
  );
}

DesktopGradeButtons.displayName = 'GradeButtons';
