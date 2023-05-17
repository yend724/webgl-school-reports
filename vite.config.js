import path from 'path';

const dirname = path.dirname(new URL(import.meta.url).pathname);

export default {
  root: path.resolve(dirname, 'src'),
  build: {
    outDir: path.resolve(dirname, 'dist'),
    rollupOptions: {
      input: {
        index: path.resolve(dirname, 'src', 'index.html'),
        '01': path.resolve(dirname, 'src', '01/index.html'),
      },
    },
  },
};
