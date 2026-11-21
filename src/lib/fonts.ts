import { Newsreader } from "next/font/google";

/**
 * Herkese açık sayfaların (ana sayfa, pazarlama, giriş/kayıt) serif başlık fontu.
 * Uygulama paneli bunu yüklemez; yalnızca `newsreader.variable` sınıfını
 * uygulayan layout'larda preload edilir.
 * `latin-ext` Türkçe karakterler (ğ, ş, İ) için gerekli.
 */
export const newsreader = Newsreader({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  variable: "--font-newsreader",
  display: "swap",
});
