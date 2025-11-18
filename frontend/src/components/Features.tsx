import * as React from "react";

const features = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    ),
    title: "로그인 없는 간단한 사용",
    description: "계정 생성의 번거로움 없이 \n이메일 구독 신청을 통해 바로 서비스를 이용해 보세요!",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    title: "AI 기반, 선택 분야에 맞는 질문 생성",
    description: "평일 오전 8시, \nAI/클라우드/CS 중 1개의 질문을 받아보세요!",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12" />
      </svg>
    ),
    title: "답변 확인 및 피드백 제공",
    description: "메일의 링크를 통해\n제한 시간 내에 오늘의 질문에 대한 답변을 입력하세요!\n인공지능이 답변을 분석하여 구체적인 피드백을 제공합니다.",
  },
];

export function Features() {
  return (
    <section className="w-full min-h-[calc(100vh-5rem)] py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center justify-center space-y-2 g-10 text-center">
          <h2 className="text-4xl text-gray-800">
            Bit-Bite
          </h2>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tighter">
            주요 기능
          </h2>
        </div>
        <div className="mx-auto grid max-w-7xl items-stretch gap-8 py-12 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="grid gap-4 p-6 rounded-lg shadow-lg bg-white transition-transform duration-300 hover:-translate-y-1 cursor-pointer"
            >
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-main text-white">
                <span className="h-6 w-6">{feature.icon}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 tracking-tighter">{feature.title}</h3>
              <p className="text-sm text-gray-500">
                {feature.description.split('\n').map((line, i, array) => (
                  <React.Fragment key={i}>
                    {line}
                    {i < array.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
