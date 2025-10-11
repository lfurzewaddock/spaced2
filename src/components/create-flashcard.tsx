import { FormTextareaImageUpload } from "@/components/form/form-textarea-image-upload";
import CmdEnterIcon from "@/components/keyboard/CmdEnterIcon";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  cardContentFormSchema,
  CardContentFormValues,
} from "@/lib/form-schema";
import { isEventTargetInput } from "@/lib/utils";
import VibrationPattern from "@/lib/vibrate";
import { zodResolver } from "@hookform/resolvers/zod";
import { Book } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type CreateFlashcardFormProps = {
  onSubmit: (values: CardContentFormValues) => void;
  numDecks?: number;
  initialFront?: string;
  initialBack?: string;
  onImageUpload?: (image: File) => Promise<void>;
};

const FOCUS_QUESTION_KEY = " ";
const LOCALSTORAGE_KEY = "create-flashcard-draft";

export function CreateUpdateFlashcardForm({
  onSubmit,
  numDecks,
  initialFront,
  initialBack,
  onImageUpload,
}: CreateFlashcardFormProps) {
  const isUpdate = initialFront || initialBack;

  const defaultValues = useMemo(() => {
    if (isUpdate) {
      return {
        front: initialFront || "",
        back: initialBack || "",
      };
    }

    console.log("Getting default values from localStorage");
    try {
      const saved = localStorage.getItem(LOCALSTORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          front: parsed.front || "",
          back: parsed.back || "",
        };
      }
    } catch (e) {
      console.error("Failed to load draft from localStorage:", e);
    }

    return {
      front: "",
      back: "",
    };
  }, [isUpdate, initialFront, initialBack]);

  const form = useForm<CardContentFormValues>({
    resolver: zodResolver(cardContentFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (initialFront) {
      form.setValue("front", initialFront);
    }
    if (initialBack) {
      form.setValue("back", initialBack);
    }
  }, [initialFront, initialBack, form]);

  // Save to localStorage on form changes (only for create mode)
  useEffect(() => {
    if (isUpdate) return;

    const subscription = form.watch((values) => {
      try {
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(values));
      } catch (e) {
        console.error("Failed to save draft to localStorage:", e);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, isUpdate]);

  const handleSubmit = useCallback(
    (data: CardContentFormValues) => {
      navigator?.vibrate(VibrationPattern.successConfirm);
      // if (!isUpdate) {
      // }

      onSubmit(data);
      form.reset();
      form.setFocus("front");

      if (isUpdate) {
        const hasChanged =
          initialFront !== data.front || initialBack !== data.back;
        if (hasChanged) {
          toast.success("Flashcard updated");
        }
      } else {
        try {
          localStorage.removeItem(LOCALSTORAGE_KEY);
        } catch (e) {
          console.error("Failed to clear draft from localStorage:", e);
        }
        toast.success("Flashcard created");
      }
    },
    [form, isUpdate, initialFront, initialBack, onSubmit],
  );

  useEffect(() => {
    // cmd enter to submit
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isEventTargetInput(event)) {
        if (event.key === FOCUS_QUESTION_KEY) {
          form.setFocus("front");
          event.preventDefault();
        }
        return;
      }
      if (event.metaKey && event.key === "Enter") {
        form.handleSubmit(handleSubmit)();
        form.setFocus("front");
        event.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [form, handleSubmit]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-4 bg-background rounded-xl p-4 h-full justify-center"
      >
        <div className="grow">
          <FormTextareaImageUpload
            onUploadImage={onImageUpload}
            className="text-sm border-none shadow-none h-32"
            form={form}
            name="front"
            // label='Question'
            placeholder="Enter the question"
          />
        </div>

        <div className="grow">
          <FormTextareaImageUpload
            onUploadImage={onImageUpload}
            className="text-sm border-none shadow-none h-32"
            form={form}
            name="back"
            // label='Answer'
            placeholder="Enter the answer"
          />
        </div>
        <div className="flex justify-start">
          {numDecks !== undefined && (
            <div className="flex gap-1 text-muted-foreground justify-center items-center font-semibold ml-2">
              <Book className="w-5 h-5" />
              <span className="text-sm">
                {numDecks} {numDecks === 1 ? "deck" : "decks"} selected
              </span>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="ml-auto self-end rounded-lg [&_svg]:size-3"
          >
            {isUpdate ? "Update" : "Create"}

            <CmdEnterIcon />
          </Button>
        </div>
      </form>
    </Form>
  );
}
