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

# Hứng biến từ GitHub Actions truyền xuống lúc build
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
ARG NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
ARG NEXT_PUBLIC_CURRENCY

# Đập vào môi trường build của Next.js
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=$NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
ENV NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=$NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
ENV NEXT_PUBLIC_CURRENCY=$NEXT_PUBLIC_CURRENCY

# Build dự án (Next.js sẽ tự động tối ưu hóa bằng Turbopack nếu mày có cấu hình)
RUN npm run build

# BẮT BUỘC: Copy thư mục public và static vào trong thư mục standalone
# Vì chế độ output: 'standalone' không tự động bao gồm 2 thư mục này.
# Nếu không copy, Next.js server (server.js) sẽ không tìm thấy ảnh và file CSS/JS giao diện gây ra lỗi 404.
RUN cp -r public .next/standalone/public
RUN cp -r .next/static .next/standalone/.next/static

# Khai báo biến môi trường production
ENV NODE_ENV=production

# Mở port bên trong container (mặc định là 3000)
EXPOSE 3000

# Lệnh khởi chạy app khi container start
CMD ["node", ".next/standalone/server.js"]