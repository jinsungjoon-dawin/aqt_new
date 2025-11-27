import { addMessages, init, locale } from "svelte-i18n";
// 번역 메시지 가져오기
import en from "./locales/en.json";
import ko from "./locales/ko.json"
// 다국어 메시지 추가
addMessages("en", en);
addMessages("ko", ko);

// 브라우저의 기본 언어 가져오기
const userLocale = navigator.language.startsWith("ko") ? "ko" : "en";

// i18n 초기화
init({
    fallbackLocale: "en",
    initialLocale: userLocale,
});

// 언어 변경 함수
export function changeLanguage(lang) {
    locale.set(lang);
}