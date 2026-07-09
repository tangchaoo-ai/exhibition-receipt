// 自动设置收藏日期
const visitDateEl = document.getElementById('visitDate');
if (visitDateEl) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateValue = visitDateEl.querySelector('.visit-date-value');
  if (dateValue) dateValue.textContent = `${yyyy}.${mm}.${dd}`;
}

const imageArea = document.getElementById('imageArea');
    const uploadInput = document.getElementById('uploadInput');
    const previewImage = document.getElementById('previewImage');
    const placeholderText = document.getElementById('placeholderText');
    const placeholderPlus = document.getElementById('placeholderPlus');
    const downloadBtn = document.getElementById('downloadBtn');
    const hiddenCanvas = document.getElementById('hiddenCanvas');
    const ctx = hiddenCanvas.getContext('2d');

    // 裁切相关
    const cropModal = document.getElementById('cropModal');
    const cropWrapper = document.getElementById('cropWrapper');
    const cropImage = document.getElementById('cropImage');
    const cropBox = document.getElementById('cropBox');
    const cropConfirm = document.getElementById('cropConfirm');
    const cropCancel = document.getElementById('cropCancel');
    let originalImage = null;
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let boxStart = { x: 0, y: 0 };

    // 点击图片区域触发上传
    imageArea.addEventListener('click', () => {
      uploadInput.click();
    });

    // 图片上传 - 显示裁切弹窗
    uploadInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          originalImage = img;
          showCropModal(img);
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });

    // 显示裁切弹窗
    function showCropModal(img) {
      cropImage.src = img.src;
      cropModal.classList.add('active');

      // 等图片加载后初始化裁切框
      cropImage.onload = () => {
        initCropBox();
      };
    }

    // 初始化裁切框（居中，1:1，取较短边）
    function initCropBox() {
      const imgW = cropImage.naturalWidth;
      const imgH = cropImage.naturalHeight;
      const displayW = cropImage.clientWidth;
      const displayH = cropImage.clientHeight;

      // 计算显示尺寸
      const shortSide = Math.min(displayW, displayH);
      const boxSize = shortSide * 0.8;

      // 居中
      const left = (displayW - boxSize) / 2;
      const top = (displayH - boxSize) / 2;

      cropBox.style.width = boxSize + 'px';
      cropBox.style.height = boxSize + 'px';
      cropBox.style.left = left + 'px';
      cropBox.style.top = top + 'px';
    }

    // 裁切框拖动
    cropBox.addEventListener('mousedown', (e) => {
      isDragging = true;
      dragStart.x = e.clientX;
      dragStart.y = e.clientY;
      boxStart.x = parseInt(cropBox.style.left) || 0;
      boxStart.y = parseInt(cropBox.style.top) || 0;
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;

      let newX = boxStart.x + dx;
      let newY = boxStart.y + dy;

      // 限制在图片范围内
      const maxW = cropImage.clientWidth - cropBox.clientWidth;
      const maxH = cropImage.clientHeight - cropBox.clientHeight;
      newX = Math.max(0, Math.min(newX, maxW));
      newY = Math.max(0, Math.min(newY, maxH));

      cropBox.style.left = newX + 'px';
      cropBox.style.top = newY + 'px';
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // 触摸支持
    cropBox.addEventListener('touchstart', (e) => {
      isDragging = true;
      const touch = e.touches[0];
      dragStart.x = touch.clientX;
      dragStart.y = touch.clientY;
      boxStart.x = parseInt(cropBox.style.left) || 0;
      boxStart.y = parseInt(cropBox.style.top) || 0;
      e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const touch = e.touches[0];

      const dx = touch.clientX - dragStart.x;
      const dy = touch.clientY - dragStart.y;

      let newX = boxStart.x + dx;
      let newY = boxStart.y + dy;

      const maxW = cropImage.clientWidth - cropBox.clientWidth;
      const maxH = cropImage.clientHeight - cropBox.clientHeight;
      newX = Math.max(0, Math.min(newX, maxW));
      newY = Math.max(0, Math.min(newY, maxH));

      cropBox.style.left = newX + 'px';
      cropBox.style.top = newY + 'px';
      e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchend', () => {
      isDragging = false;
    });

    // 取消裁切
    cropCancel.addEventListener('click', () => {
      cropModal.classList.remove('active');
      uploadInput.value = '';
    });

    // 确认裁切
    cropConfirm.addEventListener('click', () => {
      const displayW = cropImage.clientWidth;
      const displayH = cropImage.clientHeight;
      const naturalW = cropImage.naturalWidth;
      const naturalH = cropImage.naturalHeight;

      const scaleX = naturalW / displayW;
      const scaleY = naturalH / displayH;

      const boxX = parseInt(cropBox.style.left) * scaleX;
      const boxY = parseInt(cropBox.style.top) * scaleY;
      const boxW = cropBox.clientWidth * scaleX;
      const boxH = cropBox.clientHeight * scaleY;

      // 裁切并应用半调
      cropAndHalftone(boxX, boxY, boxW, boxH);

      cropModal.classList.remove('active');
    });

    // 裁切并应用半调效果
    function cropAndHalftone(sx, sy, sw, sh) {
      const size = 256;
      hiddenCanvas.width = size;
      hiddenCanvas.height = size;

      // 绘制裁切区域到正方形画布
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(originalImage, sx, sy, sw, sh, 0, 0, size, size);

      const imageData = ctx.getImageData(0, 0, size, size);
      const data = imageData.data;

      // 转换为灰度
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = data[i + 1] = data[i + 2] = gray;
      }

      // Floyd-Steinberg 误差扩散抖动
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = (y * size + x) * 4;
          const old = data[idx];
          const newVal = old < 128 ? 0 : 255;
          data[idx] = data[idx + 1] = data[idx + 2] = newVal;
          const error = old - newVal;

          if (x + 1 < size) data[(y * size + x + 1) * 4] += error * 7 / 16;
          if (y + 1 < size) {
            if (x - 1 >= 0) data[((y + 1) * size + x - 1) * 4] += error * 3 / 16;
            data[((y + 1) * size + x) * 4] += error * 5 / 16;
            if (x + 1 < size) data[((y + 1) * size + x + 1) * 4] += error * 1 / 16;
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // 显示处理后的图片
      previewImage.src = hiddenCanvas.toDataURL('image/png');
      previewImage.classList.add('active');
      placeholderText.classList.add('hidden');
      if (placeholderPlus) placeholderPlus.style.display = 'none';
      imageArea.classList.add('has-image');
    }

    // 分享 PNG
    downloadBtn.addEventListener('click', async () => {
      if (typeof html2canvas === 'undefined') {
        alert('html2canvas 未加载，请刷新页面重试');
        return;
      }

      const receipt = document.getElementById('receipt');
      const clone = receipt.cloneNode(true);
      clone.style.clipPath = 'none';
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';

      document.body.appendChild(clone);

      try {
        html2canvas(clone, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        }).then(async (canvas) => {
          document.body.removeChild(clone);

          const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg'));
          const file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' });

          if (navigator.share && navigator.canShare) {
            if (navigator.canShare({ files: [file] })) {
              try {
                await navigator.share({ files: [file] });
                return;
              } catch (e) {
                if (e.name === 'AbortError') return;
              }
            }
          }

          // fallback: 展示图片
          const dataUrl = canvas.toDataURL('image/png');
          const win = window.open('');
          if (win) {
            win.document.write('<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>保存图片</title></head><body style="margin:0;padding:20px;text-align:center;background:#f5f5f5;"><img src="' + dataUrl + '" style="max-width:100%;"><p style="margin-top:16px;font-size:16px;color:#333;">长按图片保存到相册</p></body></html>');
          } else {
            alert('请允许弹出窗口后长按图片保存');
          }
        }).catch((err) => {
          document.body.removeChild(clone);
          console.error('分享失败:', err);
          alert('分享失败，请重试');
        });
      } catch (e) {
        document.body.removeChild(clone);
        console.error('html2canvas 调用失败:', e);
        alert('分享失败: ' + e.message);
      }
    });