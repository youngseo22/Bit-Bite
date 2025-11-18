import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BackgroundImage from '../assets/gradient.png';

interface HeroProps {
  confirmationEmail: (email: string) => void;
}

export function Hero({confirmationEmail} : HeroProps) {
  const emailRegEx = /^[A-Za-z0-9]([-_.]?[A-Za-z0-9])*@[A-Za-z0-9]([-_.]?[A-Za-z0-9])*\.[A-Za-z]{2,3}$/;
  const [email, setEmail] = useState("");
  const [isError, setIsError] = useState(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEmail = e.target.value;
    setEmail(inputEmail);

    if(inputEmail.length === 0) setIsError(false);
    else if(!emailRegEx.test(inputEmail)) setIsError(true);
    else setIsError(false);
  }

  const handleSubscribe = () => {
    if(!email){
      setIsError(false);
      return;
    }
    if (isError) {
      return;
    }

    confirmationEmail(email);
    setEmail("");
    setIsError(false);
  };

  return (
    <>
      <div
        className="min-h-screen flex flex-col items-center justify-center pb-15 px-4 text-center bg-center bg-no-repeat bg-cover md:bg-contain"
        style={{backgroundImage: `url(${BackgroundImage})`}}
      >
        <h1 className="text-4xl text-gray-800">
          Bit-Bite
        </h1>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800">
          
        </h1>
        <p className="text-center mt-6 px-4 max-w-2xl mx-auto text-gray-600">
          <strong>매일 한입,</strong> CS 지식을 설명하는 습관을 들여보세요!
        </p>
        <div className="flex flex-col items-center justify-center gap-4 pt-8 w-full max-w-md mx-auto">
          <div className="relative w-full">
            <Input
              type="email"
              placeholder="이메일 주소 입력하고 구독 신청하기"
              className="w-full pr-24 py-6 border-white text-sm"
              value={email}
              onChange={handleEmailChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSubscribe()}
            />
            <Button
              type="button"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-10"
              onClick={handleSubscribe}
            >
              구독
            </Button>
          </div>

          <div className="h-6 w-full"> 
          { isError && (
            <div className="text-xs text-red-500 w-full">올바른 이메일 주소를 입력해주세요.</div> 
          )}
          </div>
        </div>
      </div>
    </>
  );
}