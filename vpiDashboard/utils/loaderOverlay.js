/**
 * Handles Loader Overlay.
 */
export default {
    loaderOverlayCount: 0, // this is needed to handle multiple loader show calls
    initialLoaderIsHidden: false,
    isFading: false,
    loaderTimeoutReference: null,
    /**
     * Shows Loader Overlay.
     * @param {number}     maxWait - Maximum loader duration
     * @returns {number}           - Count of virtual loader stacks
     */
    show: function (maxWait = 25000) {
        const loader = document.getElementById("vpiDashboardLoader"),
            vpiDashboardContainer = document.getElementById("vpiDashboard");

        clearTimeout(this.loaderTimeoutReference);
        this.loaderTimeoutReference = setTimeout(() => {
            this.hide();
        }, maxWait);

        if (loader !== null) {
            document.getElementById("vpiDashboardLoader").classList.add("loader-is-loading");
        }
        if (vpiDashboardContainer !== null && this.initialLoaderIsHidden) {
            document.getElementById("vpiDashboard").classList.add("blurry");
        }

        return ++this.loaderOverlayCount;
    },
    /**
     * Hides Loader Overlay.
     * @returns {number}   - Count of virtual loader stacks
     */
    hide: function () {
        const loader = document.getElementById("vpiDashboardLoader"),
            vpiDashboardContainer = document.getElementById("vpiDashboard");

        this.loaderOverlayCount--;
        if (this.loaderOverlayCount <= 0) {
            this.loaderOverlayCount = 0;
            if (this.isFading) {
                return this.loaderOverlayCount;
            }
            if (!this.initialLoaderIsHidden) {
                this.fade();
                return this.loaderOverlayCount;
            }

            if (loader !== null) {
                document.getElementById("vpiDashboardLoader").classList.remove("loader-is-loading");
            }
            if (vpiDashboardContainer !== null) {
                document.getElementById("vpiDashboard").classList.remove("blurry");
            }
        }
        return this.loaderOverlayCount;
    },
    /**
     * Initiates the fade animation of MP logo and title. Ths may be interrupted by a mousedown event.
     * @returns {void}
     */
    fade: function () {
        const loader = document.getElementById("vpiDashboardLoader"),
            loaderSpinnerItself = document.getElementById("vpi-loader-spinner-itself");

        this.isFading = true;
        if (loader !== null) {
            loader.addEventListener("mousedown", this.cleanup.bind(this), true);
        }
        if (loaderSpinnerItself !== null) {
            loaderSpinnerItself.classList.add("initial-fadeout-animation");
        }
        setTimeout(this.cleanup.bind(this), 3400);
    },
    /**
     * Removes portal logos and titles from Loader, also removes animation classes.
     * @returns {void}
     */
    cleanup: function () {
        const loader = document.getElementById("vpiDashboardLoader"),
            loaderSpinnerItself = document.getElementById("vpi-loader-spinner-itself");

        this.initialLoaderIsHidden = true;
        this.isFading = false;
        this.hide();

        if (loader !== null) {
            loader.classList.remove("loader-is-initially-loading");
        }
        if (loaderSpinnerItself !== null) {
            loaderSpinnerItself.classList.remove("initial-fadeout-animation");
        }
        window.INITIAL_LOADING = false;
    }
};
