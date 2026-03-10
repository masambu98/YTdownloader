// bonbon.to - Frontend Application
(function() {
    'use strict';

    const translations = {
        en: {
            'nav.youtube': 'YouTube Video Downloader',
            'nav.4k': 'YouTube 4K Downloader',
            'nav.mp4': 'YouTube to MP4',
            'nav.wav': 'YouTube to WAV',
            'nav.soundcloud': 'SoundCloud Downloader',
            'nav.tiktok': 'TikTok Downloader',
            'nav.api': 'API',
            'nav.app': 'APP',
            'title.main': 'YouTube Video Downloader',
            'title.subtitle': 'Download videos and playlists from YouTube in MP4, MP3, 4K, and more formats. Fast, free, and easy!',
            'input.placeholder': 'Paste YouTube URL here...',
            'input.paste': 'Paste from clipboard',
            'format.label': 'Format:',
            'format.video': 'Video (MP4)',
            'format.audio': 'Audio Only',
            'format.other': 'Other Video',
            'button.download': 'Download',
            'playlist.title': 'Playlist Videos',
            'playlist.selectAll': 'Select All',
            'playlist.deselectAll': 'Deselect All',
            'playlist.downloadSelected': 'Download Selected',
            'progress.preparing': 'Preparing download...',
            'progress.downloading': 'Downloading...',
            'progress.converting': 'Converting...',
            'progress.complete': 'Complete!',
            'complete.title': 'Download Complete!',
            'complete.subtitle': 'Your file is ready',
            'features.title': 'Why Choose bonbon.to?',
            'features.fast.title': 'Fast Downloads',
            'features.fast.desc': 'High-speed servers for quick video downloads. No waiting, no throttling.',
            'features.formats.title': 'Multiple Formats',
            'features.formats.desc': 'MP4, MP3, WAV, AAC, FLAC, OGG, WEBM, and more. Choose what works for you.',
            'features.quality.title': '4K Support',
            'features.quality.desc': 'Download videos in 4K, 1080p, 720p, or any quality you prefer.',
            'features.safe.title': 'Safe & Secure',
            'features.safe.desc': 'No malware, no viruses. Your privacy is our priority. HTTPS encrypted.',
            'features.free.title': '100% Free',
            'features.free.desc': 'No registration required. No hidden fees. Unlimited downloads.',
            'features.playlist.title': 'Playlist Support',
            'features.playlist.desc': 'Download entire YouTube playlists with one click.',
            'howto.title': 'How to Download YouTube Videos',
            'howto.step1.title': 'Copy URL',
            'howto.step1.desc': 'Copy the YouTube video or playlist URL from your browser.',
            'howto.step2.title': 'Paste URL',
            'howto.step2.desc': 'Paste the URL in the input box above and select your format.',
            'howto.step3.title': 'Download',
            'howto.step3.desc': 'Click Download and get your file in seconds. It\'s that easy!',
            'faq.title': 'Frequently Asked Questions',
            'faq.q1': 'Is bonbon.to free to use?',
            'faq.a1': 'Yes! bonbon.to is completely free to use. There are no hidden fees, no registration required, and no download limits.',
            'faq.q2': 'What formats are supported?',
            'faq.a2': 'We support MP4 (144p to 4K), MP3, WAV, AAC, FLAC, OGG, OPUS, and WEBM formats.',
            'faq.q3': 'Can I download playlists?',
            'faq.a3': 'Yes! Simply paste a playlist URL and we\'ll show you all videos.',
            'faq.q4': 'Is it safe and legal?',
            'faq.a4': 'bonbon.to is safe to use with HTTPS encryption. Please respect copyright laws.',
            'faq.q5': 'Why is my download slow?',
            'faq.a5': 'Download speed depends on your internet connection and server load.',
            'footer.tagline': 'The best free YouTube video downloader online.',
            'footer.tools': 'Tools',
            'footer.youtube': 'YouTube Downloader',
            'footer.mp3': 'YouTube to MP3',
            'footer.mp4': 'YouTube to MP4',
            'footer.soundcloud': 'SoundCloud Downloader',
            'footer.tiktok': 'TikTok Downloader',
            'footer.support': 'Support',
            'footer.faq': 'FAQ',
            'footer.contact': 'Contact Us',
            'footer.api': 'API',
            'footer.app': 'Mobile App',
            'footer.legal': 'Legal',
            'footer.terms': 'Terms of Service',
            'footer.privacy': 'Privacy Policy',
            'footer.dmca': 'DMCA',
            'footer.language': 'Language',
            'footer.copyright': '© 2024 bonbon.to. All rights reserved.',
            'footer.disclaimer': 'We do not host any videos. All downloads are processed through yt-dlp.',
            'error.invalidUrl': 'Please enter a valid YouTube URL',
            'error.fetchFailed': 'Failed to fetch video information. Please check the URL.',
            'error.downloadFailed': 'Download failed. Please try again.',
            'error.unsupported': 'Unsupported URL. Please use a YouTube URL.'
        }
    };

    const elements = {
        urlInput: document.getElementById('urlInput'),
        formatSelect: document.getElementById('formatSelect'),
        downloadBtn: document.getElementById('downloadBtn'),
        pasteBtn: document.getElementById('pasteBtn'),
        errorMessage: document.getElementById('errorMessage'),
        videoInfo: document.getElementById('videoInfo'),
        videoThumbnail: document.getElementById('videoThumbnail'),
        videoTitle: document.getElementById('videoTitle'),
        videoUploader: document.getElementById('videoUploader'),
        videoDuration: document.getElementById('videoDuration'),
        playlistSection: document.getElementById('playlistSection'),
        playlistVideos: document.getElementById('playlistVideos'),
        playlistCount: document.getElementById('playlistCount'),
        selectAllBtn: document.getElementById('selectAllBtn'),
        deselectAllBtn: document.getElementById('deselectAllBtn'),
        downloadSelectedBtn: document.getElementById('downloadSelectedBtn'),
        selectedCount: document.getElementById('selectedCount'),
        progressSection: document.getElementById('progressSection'),
        progressBar: document.getElementById('progressFill'),
        progressStatus: document.getElementById('progressStatus'),
        progressPercentage: document.getElementById('progressPercentage'),
        progressDetails: document.getElementById('progressDetails'),
        downloadComplete: document.getElementById('downloadComplete'),
        navToggle: document.getElementById('navToggle'),
        navMenu: document.getElementById('navMenu'),
        languageSelect: document.getElementById('languageSelect'),
        footerLanguageSelect: document.getElementById('footerLanguageSelect')
    };

    let currentPlaylist = [];
    let currentFormat = 'mp4_1080';
    let currentDownloadId = null;
    let progressInterval = null;

    function init() {
        bindEvents();
        initFAQ();
        checkUrlParams();
    }

    function bindEvents() {
        elements.navToggle?.addEventListener('click', toggleNav);
        elements.pasteBtn?.addEventListener('click', pasteFromClipboard);
        elements.downloadBtn?.addEventListener('click', handleDownload);

        // input event with debounce for typing
        elements.urlInput?.addEventListener('input', debounce(() => {
            handleUrlInput(elements.urlInput.value.trim());
        }, 500));

        // paste event — read value AFTER browser inserts it
        elements.urlInput?.addEventListener('paste', (e) => {
            const pasted = (e.clipboardData || window.clipboardData).getData('text');
            setTimeout(() => handleUrlInput(pasted || elements.urlInput.value.trim()), 0);
        });

        elements.formatSelect?.addEventListener('change', (e) => {
            currentFormat = e.target.value;
        });

        elements.languageSelect?.addEventListener('change', (e) => changeLanguage(e.target.value));
        elements.footerLanguageSelect?.addEventListener('change', (e) => changeLanguage(e.target.value));

        elements.selectAllBtn?.addEventListener('click', () => togglePlaylistSelection(true));
        elements.deselectAllBtn?.addEventListener('click', () => togglePlaylistSelection(false));
        elements.downloadSelectedBtn?.addEventListener('click', downloadSelected);

        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                elements.navMenu?.classList.remove('active');
            });
        });
    }

    function toggleNav() {
        elements.navMenu?.classList.toggle('active');
    }

    async function pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            elements.urlInput.value = text;
            handleUrlInput(text);
        } catch (err) {
            showError('Unable to access clipboard. Please paste manually.');
        }
    }

    // Single source of truth — always pass url explicitly, never read from DOM inside
    async function handleUrlInput(url) {
        url = (url || '').trim();

        if (!url) {
            hideVideoInfo();
            hidePlaylist();
            hideError();
            return;
        }

        if (!isValidYouTubeUrl(url)) {
            hideVideoInfo();
            hidePlaylist();
            return;
        }

        hideError();
        showLoading();

        try {
            const response = await fetch('/api/info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch info');
            }

            if (data.type === 'playlist') {
                showPlaylist(data.videos);
                hideVideoInfo();
            } else {
                showVideoInfo(data);
                hidePlaylist();
            }
        } catch (error) {
            showError(error.message);
        } finally {
            hideLoading();
        }
    }

    function isValidYouTubeUrl(url) {
        const patterns = [
            /youtube\.com\/watch\?v=/,
            /youtu\.be\//,
            /youtube\.com\/playlist\?list=/,
            /youtube\.com\/shorts\//,
            /youtube\.com\/embed\//
        ];
        return patterns.some(pattern => pattern.test(url));
    }

    function showVideoInfo(video) {
        if (elements.videoThumbnail) elements.videoThumbnail.src = video.thumbnail || '';
        if (elements.videoTitle) elements.videoTitle.textContent = video.title || '';
        // server returns both uploader and channel — use whichever exists
        if (elements.videoUploader) elements.videoUploader.textContent = video.uploader || video.channel || '';
        if (elements.videoDuration) elements.videoDuration.textContent = formatDuration(video.duration);
        if (elements.videoInfo) elements.videoInfo.style.display = 'flex';
    }

    function hideVideoInfo() {
        if (elements.videoInfo) elements.videoInfo.style.display = 'none';
    }

    function showPlaylist(videos) {
        currentPlaylist = videos;
        if (elements.playlistCount) elements.playlistCount.textContent = videos.length;

        if (elements.playlistVideos) {
            elements.playlistVideos.innerHTML = videos.map((video, index) => `
                <div class="playlist-video-item" data-index="${index}">
                    <input type="checkbox" id="video-${index}" checked data-index="${index}">
                    <img src="${video.thumbnail || ''}" alt="">
                    <div class="playlist-video-info">
                        <h4>${escapeHtml(video.title || '')}</h4>
                        <p>${escapeHtml(video.uploader || video.channel || '')}</p>
                    </div>
                    <span class="playlist-video-duration">${formatDuration(video.duration)}</span>
                </div>
            `).join('');

            document.querySelectorAll('.playlist-video-item input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', updateSelectedCount);
            });
        }

        updateSelectedCount();
        if (elements.playlistSection) elements.playlistSection.style.display = 'block';
    }

    function hidePlaylist() {
        if (elements.playlistSection) elements.playlistSection.style.display = 'none';
        currentPlaylist = [];
    }

    function togglePlaylistSelection(select) {
        document.querySelectorAll('.playlist-video-item input[type="checkbox"]').forEach(cb => {
            cb.checked = select;
        });
        updateSelectedCount();
    }

    function updateSelectedCount() {
        const selected = document.querySelectorAll('.playlist-video-item input[type="checkbox"]:checked').length;
        if (elements.selectedCount) elements.selectedCount.textContent = selected;
        if (elements.downloadSelectedBtn) elements.downloadSelectedBtn.disabled = selected === 0;
    }

    async function downloadSelected() {
        const selectedIndices = Array.from(
            document.querySelectorAll('.playlist-video-item input[type="checkbox"]:checked')
        ).map(cb => parseInt(cb.dataset.index));

        for (const i of selectedIndices) {
            const video = currentPlaylist[i];
            if (video?.id) {
                await startDownload(`https://youtube.com/watch?v=${video.id}`, video.title);
            }
        }
    }

    async function handleDownload() {
        const url = elements.urlInput.value.trim();

        if (!url) {
            showError('Please enter a URL');
            return;
        }

        if (!isValidYouTubeUrl(url)) {
            showError('Please enter a valid YouTube URL');
            return;
        }

        await startDownload(url);
    }

    async function startDownload(url, filename = null) {
        hideError();
        hideVideoInfo();
        hidePlaylist();
        showProgress();

        const downloadId = generateId();
        currentDownloadId = downloadId;

        startProgressPolling(downloadId);

        try {
            const response = await fetch('/api/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, format: currentFormat, filename, downloadId })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Download failed' }));
                throw new Error(error.error || 'Download failed');
            }

            const disposition = response.headers.get('Content-Disposition');
            const downloadFilename = disposition
                ? disposition.match(/filename="([^"]+)"/)?.[1]
                : `download.${getExtension(currentFormat)}`;

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = downloadFilename || `download.${getExtension(currentFormat)}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);

            showComplete();
        } catch (error) {
            showError(error.message);
        } finally {
            stopProgressPolling();
        }
    }

    function startProgressPolling(downloadId) {
        updateProgress(0, 'preparing');

        progressInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/progress/${downloadId}`);
                if (response.ok) {
                    const data = await response.json();
                    updateProgress(data.progress || 0, data.status || 'preparing');
                    if (data.status === 'completed' || data.status === 'error') {
                        stopProgressPolling();
                    }
                }
            } catch (e) {
                // silent — server may not have registered ID yet
            }
        }, 1000);
    }

    function stopProgressPolling() {
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
    }

    function updateProgress(percentage, status) {
        if (elements.progressBar) elements.progressBar.style.width = `${percentage}%`;
        if (elements.progressPercentage) elements.progressPercentage.textContent = `${Math.round(percentage)}%`;

        const statusText = {
            'preparing': 'Preparing download...',
            'downloading': 'Downloading...',
            'converting': 'Converting...',
            'completed': 'Complete!',
            'error': 'Error occurred'
        };

        if (elements.progressStatus) elements.progressStatus.textContent = statusText[status] || status;
    }

    function showProgress() {
        if (elements.progressSection) elements.progressSection.style.display = 'block';
        if (elements.downloadComplete) elements.downloadComplete.style.display = 'none';
        setLoading(true);
    }

    function showComplete() {
        if (elements.progressSection) elements.progressSection.style.display = 'none';
        if (elements.downloadComplete) elements.downloadComplete.style.display = 'block';
        setLoading(false);
        setTimeout(() => {
            if (elements.downloadComplete) elements.downloadComplete.style.display = 'none';
        }, 3000);
    }

    function showError(message) {
        if (elements.errorMessage) {
            elements.errorMessage.textContent = message;
            elements.errorMessage.style.display = 'block';
        }
        setLoading(false);
    }

    function hideError() {
        if (elements.errorMessage) elements.errorMessage.style.display = 'none';
    }

    function showLoading() { setLoading(true); }
    function hideLoading() { setLoading(false); }

    function setLoading(loading) {
        if (!elements.downloadBtn) return;
        elements.downloadBtn.disabled = loading;
        const btnText = elements.downloadBtn.querySelector('.btn-text');
        const btnLoader = elements.downloadBtn.querySelector('.btn-loader');
        if (btnText) btnText.style.display = loading ? 'none' : 'block';
        if (btnLoader) btnLoader.style.display = loading ? 'flex' : 'none';
    }

    function initFAQ() {
        document.querySelectorAll('.faq-question').forEach(question => {
            question.addEventListener('click', () => {
                const item = question.parentElement;
                const isActive = item.classList.contains('active');
                document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
                if (!isActive) item.classList.add('active');
            });
        });
    }

    function changeLanguage(lang) {
        const t = translations[lang] || translations.en;

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (t[key]) el.textContent = t[key];
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.dataset.i18nPlaceholder;
            if (t[key]) el.placeholder = t[key];
        });

        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.dataset.i18nTitle;
            if (t[key]) el.title = t[key];
        });

        if (elements.languageSelect) elements.languageSelect.value = lang;
        if (elements.footerLanguageSelect) elements.footerLanguageSelect.value = lang;
    }

    function checkUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const url = params.get('url');
        const format = params.get('format');

        if (url) {
            elements.urlInput.value = url;
            handleUrlInput(url);
        }

        if (format && elements.formatSelect) {
            elements.formatSelect.value = format;
            currentFormat = format;
        }
    }

    function formatDuration(seconds) {
        if (!seconds) return '';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    function getExtension(format) {
        const formatMap = {
            'mp4_144': 'mp4', 'mp4_240': 'mp4', 'mp4_360': 'mp4',
            'mp4_480': 'mp4', 'mp4_720': 'mp4', 'mp4_1080': 'mp4', 'mp4_4k': 'mp4',
            'mp3': 'mp3', 'wav': 'wav', 'aac': 'aac',
            'flac': 'flac', 'ogg': 'ogg', 'opus': 'opus', 'webm': 'webm'
        };
        return formatMap[format] || 'mp4';
    }

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();