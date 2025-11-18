import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
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
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;

  useEffect(() => {
    if (!isOpen) { // 다이얼로그가 닫힐 때 상태 초기화
      setCode("");
      setIsError(false);
      setIsSuccess(false);
      setIsLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    let successTimer: number;

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

  const handleConfirmationCode = () => {
    if (isSuccess) return; // 이미 인증 절차가 시작되었으면 중복 실행 방지

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
          <DialogDescription>
            <strong>{email}</strong>으로 인증번호가 전송되었습니다.
            <div className="flex flex-row items-center justify-center w-full mt-10 mb-5 gap-2">
              <Input
                type="text"
                placeholder="인증번호(여섯자리)"
                className="flex-1 h-10"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleConfirmationCode()}
                disabled={isSuccess}
              />
            </div>
            <div className="h-3 w-full">
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
            </div>

            <Button
              type="button"
              className="h-10 w-full mt-2"
              onClick={handleConfirmationCode}
              disabled={isLoading || code.length === 0}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "인증하기"
              )}
            </Button>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
