FROM node:20-alpine

# Cài thêm các thư viện hệ thống bắt buộc phải có cho ARM64 và các native module (sharp, bcrypt...)
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy package.json và package-lock.json (nếu có) vào trước để tận dụng Docker Cache
COPY package*.json ./

# Cài đặt sạch sẽ dependencies
RUN npm install --legacy-peer-deps

# Copy toàn bộ source code còn lại vào container
COPY . .

# Build dự án (Next.js sẽ tự động tối ưu hóa bằng Turbopack nếu mày có cấu hình)
RUN npm run build

# Khai báo biến môi trường production
ENV NODE_ENV=production

# Mở port bên trong container (mặc định là 3000)
EXPOSE 3000

# Lệnh khởi chạy app khi container start
CMD ["npm", "start"]