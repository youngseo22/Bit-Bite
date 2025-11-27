import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface SubscriptionConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  email: string;
  onConfirm: () => void;
}

export function SubscriptionConfirmationDialog({
  isOpen,
  onOpenChange,
  email,
  onConfirm,
}: SubscriptionConfirmationDialogProps) {
  const [code, setCode] = useState("");
  const [timer, setTimer] = useState(5 * 60);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;

  useEffect(() => {
    if (!isOpen) {
      // 다이얼로그가 닫힐 때 상태 초기화
      setCode("");
      setIsError(false);
      setIsSuccess(false);
      setIsLoading(false);
      setTimer(5 * 60);
    }
  }, [isOpen]);

  useEffect(() => {
    let successTimer: ReturnType<typeof setTimeout>;

    if (isSuccess) {
      setIsLoading(true);
      successTimer = setTimeout(() => {
        onConfirmRef.current();
        setIsLoading(false);
      }, 1000);
    }

    return () => {
      clearTimeout(successTimer);
    };
  }, [isSuccess]);

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
    if (isSuccess || timer === 0) return;

    if (code.length !== 6) {
      setIsError(true);
      return;
    }

    setIsError(false);
    setIsSuccess(true);
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
                  placeholder="인증번호(여섯자리)"
                  className="h-10 w-full pr-16"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleConfirmationCode()
                  }
                  disabled={isSuccess || timer === 0}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-blue-500 font-mono text-sm">
                    {formatTime()}
                  </span>
                </div>
              </div>
              <div className="h-5 w-full">
                {isError && (
                  <div className="text-xs text-red-500 w-full">
                    인증번호는 6자리여야 합니다.
                  </div>
                )}
                {isSuccess && (
                  <div className="text-xs text-green-500 w-full">
                    인증되었습니다.
                  </div>
                )}
                {timer === 0 && !isSuccess && (
                  <div className="text-xs text-red-500 w-full">
                    시간이 초과되었습니다.
                  </div>
                )}
              </div>
              <Button
                type="button"
                className="h-10 w-full mt-2"
                onClick={handleConfirmationCode}
                disabled={
                  isLoading || code.length !== 6 || isSuccess || timer === 0
                }
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
