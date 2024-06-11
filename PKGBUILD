# Maintainer: Jed ogelbw@gmail.com
pkgname=remarkably-synced
pkgver=1.0.0
pkgrel=1
pkgdesc="Remarkably Synced - A synchronization utility"
arch=('x86_64')
url="https://example.com"
license=('MIT')
depends=('electron')
source=("remarkably-synced-${pkgver}.pacman")
sha256sums=('SKIP')
options=(!debug)

package() {
    bsdtar -xf "${srcdir}/remarkably-synced-${pkgver}.pacman" -C "${pkgdir}/"
    rm -f "${pkgdir}/.INSTALL" "${pkgdir}/.MTREE" "${pkgdir}/.PKGINFO"
    rm -rf "${pkgdir}/usr/lib/debug/.build-id/"
}