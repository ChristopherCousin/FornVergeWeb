// Inicialización de Swiper
const heroSwiper = new Swiper('.hero-swiper', {
    effect: 'fade',
    loop: true,
    autoplay: {
        delay: 3000,
        disableOnInteraction: false,
    },
    pagination: {
        el: '.swiper-pagination',
        clickable: true,
    },
});

// Manejo de las pestañas de categorías
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.category-content');

    // Función para cambiar de categoría
    function switchCategory(categoryId) {
        // Remover clase active de todas las pestañas y contenidos
        tabs.forEach(tab => tab.classList.remove('active'));
        contents.forEach(content => content.classList.remove('active'));

        // Activar la pestaña seleccionada
        const selectedTab = document.querySelector(`[data-category="${categoryId}"]`);
        const selectedContent = document.getElementById(categoryId);

        if (selectedTab && selectedContent) {
            selectedTab.classList.add('active');
            selectedContent.classList.add('active');
        }
    }

    // Event listeners para las pestañas
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const category = tab.dataset.category;
            switchCategory(category);
        });
    });

    // Animación suave al hacer scroll
    const menuItems = document.querySelectorAll('.menu-item');
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    menuItems.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'all 0.5s ease';
        observer.observe(item);
    });

    // Selector de ubicación
    const locationSelector = document.getElementById('locationSelector');
    locationSelector.addEventListener('change', (e) => {
        // Aquí puedes agregar la lógica para cambiar los precios o productos
        // según la ubicación seleccionada
        console.log('Ubicación seleccionada:', e.target.value);
    });

    // Efecto parallax en las imágenes de los slides
    const heroSlides = document.querySelectorAll('.hero-slide');
    heroSlides.forEach(slide => {
        const img = slide.querySelector('.hero-image');
        slide.addEventListener('mousemove', (e) => {
            const { left, top, width, height } = slide.getBoundingClientRect();
            const x = (e.clientX - left) / width;
            const y = (e.clientY - top) / height;
            
            img.style.transform = `scale(1.1) translate(${x * 10}px, ${y * 10}px)`;
        });

        slide.addEventListener('mouseleave', () => {
            img.style.transform = 'scale(1) translate(0, 0)';
        });
    });
});
