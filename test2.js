    const avatarBtn = document.getElementById('avatarBtn');
    const menu = document.getElementById('menu');
    const userInfo = document.getElementById('userInfo');
    const menuItems = document.getElementById('menuItems');
    const closeBtn = document.getElementById('closeBtn');
    const overlay = document.getElementById('overlay');
    let isOpen = false;

    function toggleMenu() {
      isOpen = !isOpen;
      
      if (isOpen) {
        menu.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
        menu.classList.add('opacity-100', 'scale-100');
        userInfo.classList.remove('opacity-0', '-translate-x-4');
        userInfo.classList.add('opacity-100', 'translate-x-0');
        menuItems.classList.add('menu-open');
        overlay.classList.remove('hidden');
      } else {
        menu.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
        menu.classList.remove('opacity-100', 'scale-100');
        userInfo.classList.add('opacity-0', '-translate-x-4');
        userInfo.classList.remove('opacity-100', 'translate-x-0');
        menuItems.classList.remove('menu-open');
        overlay.classList.add('hidden');
      }
    }

    avatarBtn.addEventListener('click', toggleMenu);
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isOpen) toggleMenu();
    });
    overlay.addEventListener('click', () => {
      if (isOpen) toggleMenu();
    });

    // Close menu when clicking menu items
    const menuButtons = menuItems.querySelectorAll('button');
    menuButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        console.log('Menu item clicked:', btn.textContent.trim());
        if (isOpen) toggleMenu();
      });
    });