import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface SubscriptionConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  email: string;
  onConfirm: (code: string) => void;
  isLoading: boolean;
  errorMessage?: string;
}

export function SubscriptionConfirmationDialog({
  isOpen,
  onOpenChange,
  email,
  onConfirm,
  isLoading,
  errorMessage,
}: SubscriptionConfirmationDialogProps) {
  const [code, setCode] = useState("");
  const [timer, setTimer] = useState(5 * 60);

  useEffect(() => {
    if (isOpen) {
      setTimer(5 * 60);
    } else {
      setCode("");
    }
  }, [isOpen]);

  const formatTime = () => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
  };

  useEffect(() => {
    if (!isOpen || timer <= 0) {
      return;
    }
    const intervalId = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timer, isOpen]);

  const handleConfirmationCode = () => {
    if (timer === 0) return;
    onConfirm(code);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>인증 메일 전송</DialogTitle>
          <DialogDescription asChild>
            <div>
              <strong>{email}</strong>으로 인증번호가 전송되었습니다.
              <div className="relative w-full mt-10 mb-5">
                <Input
                  type="text"
                  placeholder="인증번호"
                  className="h-10 w-full pr-16"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleConfirmationCode()
                  }
                  disabled={timer === 0 || isLoading}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-blue-500 font-mono text-sm">
                    {formatTime()}
                  </span>
                </div>
              </div>
              <div className="h-5 w-full">
                {errorMessage && (
                  <div className="text-xs text-red-500 w-full">
                    {errorMessage}
                  </div>
                )}
                {timer === 0 && (
                  <div className="text-xs text-red-500 w-full">
                    시간이 초과되었습니다.
                  </div>
                )}
              </div>
              <Button
                type="button"
                className="h-10 w-full mt-2"
                onClick={handleConfirmationCode}
                disabled={isLoading || code.length === 0 || timer === 0}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "인증하기"
                )}
              </Button>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
