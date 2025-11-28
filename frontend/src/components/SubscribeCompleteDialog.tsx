import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
  } from "@/components/ui/dialog";
  import { useRef } from "react";
  
  interface SubscribeCompleteDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onConfirm: () => void;
    onCancle: () => void;
  }
  
  export function SubscribeCompleteDialog({
    isOpen,
    onOpenChange,
    onConfirm,
    onCancle,
  }: SubscribeCompleteDialogProps) {
    const onConfirmRef = useRef(onConfirm);
    onConfirmRef.current = onConfirm;

    const onCancleRef = useRef(onCancle);
    onCancleRef.current = onCancle;
  
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
          <DialogTitle>🥳비트바이트 구독이 완료되었어요!</DialogTitle>
            <DialogDescription>
              <div className="flex flex-col">
                <p className="flex-1 h-10 mt-3 mb-6">이제부터 평일 오전 8시,<br />선택한 분야의 질문을 받아보세요.</p>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }
  