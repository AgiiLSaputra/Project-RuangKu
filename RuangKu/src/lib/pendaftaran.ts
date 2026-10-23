export interface DataLangkah1 {
  nama: string;
  email: string;
  wa: string;
  sandi: string;
}

let tersimpan: DataLangkah1 | null = null;

export const simpanLangkah1 = (d: DataLangkah1) => {
  tersimpan = d;
};
export const ambilLangkah1 = () => tersimpan;
export const hapusLangkah1 = () => {
  tersimpan = null;
};
