export interface StarRatingConfig {
    /** Total number of stars to display. Default: 5 */
    total?: number;

    /** Initial rating value (supports half stars). Default: 0 */
    initialValue?: number;

    /** Size of each star in pixels. Default: 28 */
    size?: number;

    /** Color of filled stars. Default: '#EF9F27' */
    filledColor?: string;

    /** Color of empty stars (stroke). Default: '#D3D1C7' */
    emptyColor?: string;

    /** Allow half-star precision on click. Default: false */
    allowHalf?: boolean;

    /** Make stars read-only (no hover/click). Default: false */
    readonly?: boolean;

    /** Show numeric value label next to stars. Default: false */
    showLabel?: boolean;

    /** Spacing between stars in pixels. Default: 4 */
    gap?: number;
    formControlName?:string;
    label?:string
}

export const DEFAULT_STAR_CONFIG: Required<StarRatingConfig> = {
    total: 5,
    initialValue: 0,
    size: 28,
    filledColor: '#EF9F27',
    emptyColor: '#D3D1C7',
    allowHalf: false,
    readonly: false,
    showLabel: false,
    gap: 4,
    formControlName: "",
    label : "Rating"
};