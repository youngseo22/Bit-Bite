import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EmailInputDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onEmailSubmit: (email: string) => void;
}

export function EmailInputDialog({
  isOpen,
  onOpenChange,
  onEmailSubmit,
}: EmailInputDialogProps) {
  const [email, setEmail] = useState("");

  const handleSubmit = () => {
    if (email) {
      onEmailSubmit(email);
      setEmail("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>시작하기</DialogTitle>
          <DialogDescription>
            이메일을 입력하고 성장을 위한 첫 걸음을 내딛어 보세요.
          </DialogDescription>
        </DialogHeader>
        <div className="relative w-full mt-2">
          <Input
            type="email"
            placeholder="이메일 주소를 입력해주세요."
            className="w-full pr-24 py-6"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <Button
            type="button"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-10"
            onClick={handleSubmit}
          >
            제출
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
