export function formatPrice(n: number): string {
  return Number(n).toLocaleString('ko-KR') + '원';
}
