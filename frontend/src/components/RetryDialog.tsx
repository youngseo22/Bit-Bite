import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
  } from "@/components/ui/dialog";
  import { Button } from "@/components/ui/button";
  import { useRef } from "react";
  
  interface RetryDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onConfirm: () => void;
    onCancle: () => void;
  }
  
  export function RetryDialog({
    isOpen,
    onOpenChange,
    onConfirm,
    onCancle,
  }: RetryDialogProps) {
    const onConfirmRef = useRef(onConfirm);
    onConfirmRef.current = onConfirm;

    const onCancleRef = useRef(onCancle);
    onCancleRef.current = onCancle;
  
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
          <DialogTitle>⏱️고민할 시간이 부족했나요?</DialogTitle>
            <DialogDescription>
              <div className="flex flex-col items-center justify-center">
              <p className="flex-1 h-10 mt-3 mb-6">깊이 있는 생각은 시간이 걸리기 마련이죠.<br />시간을 더 가지고 풀이를 다시 생각해보고 싶으시다면, 지금 바로 다시 시도해 보세요!</p>

              <div className="flex flex-row items-center justify-center gap-2 w-full mt-2">
                <Button type="button" className="h-10" onClick={onCancleRef.current}>
                홈으로 가기
                </Button>
                <Button type="button" className="h-10 !bg-black !text-white" onClick={onConfirmRef.current}>
                다시 시작하기
                </Button>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }
  