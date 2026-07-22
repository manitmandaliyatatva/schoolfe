import { Directive, HostListener } from '@angular/core';

@Directive({
    selector: '[NoScrollInput]',
    standalone: true
})
export class NoScrollInputDirective {

    @HostListener('wheel', ['$event'])
    onWheel(event: Event) {
        event.preventDefault();
    }

    @HostListener('keydown', ['$event'])
    onArrowPress(event: KeyboardEvent) {
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
            event.stopPropagation();
        }
    }
}