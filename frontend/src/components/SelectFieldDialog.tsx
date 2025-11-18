import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog";
  import { Button } from "@/components/ui/button";
  import { useState, useEffect } from "react";
  
  interface SelectFieldDialogDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    email: string;
  }
  
  export function SelectFieldDialog({
    isOpen,
    onOpenChange,
  }: SelectFieldDialogDialogProps) {
    const [selectedCategory, setSelectedCategory] = useState("인공지능");
    const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  
    useEffect(() => {
      if (!isOpen) { // 다이얼로그가 닫힐 때 상태 초기화
        setSelectedCategory("인공지능");
        setAgreedToPrivacy(false);
      }
    }, [isOpen]);

    const handleSave = () => {
      onOpenChange(false);
    };
  
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>구독 분야 선택</DialogTitle>
            <DialogDescription className="pt-4">
              <strong>평일 오전 8시</strong>, 비트바이트에게 받아볼 분야를 선택해보세요.

              <div className="flex flex-row items-center justify-center w-full my-5 gap-2">
              <div className="relative flex flex-col rounded-xl bg-white shadow">
                <nav className="flex min-w-[240px] flex-col gap-1 p-2">
                  <div role="button" className="flex w-full items-center rounded-lg p-0 transition-all hover:bg-slate-100 focus:bg-slate-100 active:bg-slate-100">
                    <label className="flex w-full cursor-pointer items-center px-3 py-2">
                      <div className="inline-flex items-center">
                        <label className="relative flex items-center cursor-pointer">
                          <div className="relative w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center">
                            <input
                              name="framework"
                              type="radio"
                              className="absolute opacity-0 w-full h-full cursor-pointer peer"
                              id="react-vertical"
                              value="인공지능"
                              checked={selectedCategory === "인공지능"}
                              onChange={() => setSelectedCategory("인공지능")}
                            />
                            <span className="w-3 h-3 rounded-full bg-main opacity-0 peer-checked:opacity-100 transition-opacity duration-200"></span>
                          </div>
                          <label className="ml-2 text-slate-600 cursor-pointer text-sm">
                            인공지능
                          </label>
                        </label>
                      </div>
                    </label>
                  </div>
                  <div role="button" className="flex w-full items-center rounded-lg p-0 transition-all hover:bg-slate-100 focus:bg-slate-100 active:bg-slate-100" >
                    <label className="flex w-full cursor-pointer items-center px-3 py-2">
                      <div className="inline-flex items-center">
                        <label className="relative flex items-center cursor-pointer">
                          <div className="relative w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center">
                            <input
                              name="framework"
                              type="radio"
                              className="absolute opacity-0 w-full h-full cursor-pointer peer"
                              id="cloud-vertical"
                              value="클라우드"
                              checked={selectedCategory === "클라우드"}
                              onChange={() => setSelectedCategory("클라우드")}
                            />
                            <span className="w-3 h-3 rounded-full bg-main opacity-0 peer-checked:opacity-100 transition-opacity duration-200"></span>
                          </div>
                          <label className="ml-2 text-slate-600 cursor-pointer text-sm">
                            클라우드
                          </label>
                        </label>
                      </div>
                    </label>
                  </div>
                  <div role="button" className="flex w-full items-center rounded-lg p-0 transition-all hover:bg-slate-100 focus:bg-slate-100 active:bg-slate-100" >
                    <label className="flex w-full cursor-pointer items-center px-3 py-2">
                      <div className="inline-flex items-center">
                        <label className="relative flex items-center cursor-pointer">
                          <div className="relative w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center">
                            <input
                              name="framework"
                              type="radio"
                              className="absolute opacity-0 w-full h-full cursor-pointer peer"
                              id="cs-vertical"
                              value="CS"
                              checked={selectedCategory === "CS"}
                              onChange={() => setSelectedCategory("CS")}
                            />
                            <span className="w-3 h-3 rounded-full bg-main opacity-0 peer-checked:opacity-100 transition-opacity duration-200"></span>
                          </div>
                          <label className="ml-2 text-slate-600 cursor-pointer text-sm">
                            CS
                          </label>
                        </label>
                      </div>
                    </label>
                  </div>
                </nav>
              </div>
              </div>

              <div className="flex items-center justify-center mt-5">
                <input
                  type="checkbox"
                  id="privacy-agreement"
                  checked={agreedToPrivacy}
                  onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                  className="mr-2 h-4 w-4 accent-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="privacy-agreement" className="text-sm text-gray-600 cursor-pointer">
                  개인정보 수집 및 이용에 동의합니다.
                </label>
              </div>

              <Button
                type="button"
                className="h-10 w-full mt-4"
                onClick={handleSave}
                disabled={!agreedToPrivacy}
              >
                저장하기
              </Button>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }
  