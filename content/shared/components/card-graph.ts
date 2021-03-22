// =============================================================================
// Card Graph Component
// (c) Mathigon
// =============================================================================


import {$N, CustomElementView, ElementView, register, SVGParentView, SVGView, Draggable, animate, ease, hover} from '@mathigon/boost';
import { Point } from '@mathigon/euclid';
import {lerp} from '@mathigon/fermat';
import { shuffle } from '@mathigon/fermat/src/random';
import { CoordinateSystem, Step } from '../types';

const avatarSize = 32;

type Plot = {
    color: string,
    function: (x: number) => number,
}

type Card = {
    description?: string,
    imagePath?: string,
    label?: string,
    hint: string,
    point: Point,
}

@register('x-card-graph')
export class CardGraph extends CustomElementView {
    private $graph!: CoordinateSystem;
    private $overlay!: ElementView;
    private $instructionText!: ElementView;
    private $descriptionText!: ElementView;
    private graphWidth!: number;
    private graphHeight!: number;
    private $step?: Step;

    ready() {
        this.$graph = this.$('x-coordinate-system')! as CoordinateSystem;
        this.$overlay = this.$graph.$svg.$('.overlay')!;

        this.graphWidth = parseInt(this.$graph.attr('width'));
        this.graphHeight = parseInt(this.$graph.attr('height'));
      
        this.$graph.$svg.setAttr('height', this.graphHeight+100);
        this.$graph.$svg.setAttr('viewBox', `0 0 ${this.graphWidth} ${this.graphHeight-50}`);

        this.$instructionText = $N('text', {class: 'card-instruction', 'alignment-baseline': 'middle', 'text-anchor': 'middle', transform: `translate(${this.graphWidth/2}, ${this.graphHeight+10})`}, this.$overlay);
        this.$descriptionText = $N('text', {class: 'card-description', 'alignment-baseline': 'middle', 'text-anchor': 'middle', transform: `translate(${this.graphWidth/2}, ${this.graphHeight+10})`}, this.$overlay);

        this.$instructionText.text = 'Drag each card onto its corresponding point';
    }

    bindStep($step: Step) {
      this.$step = $step;
    }

    setPlots(plots: Plot[]) {
        this.$graph.setFunctions.apply(this.$graph, plots.map((plot) => plot.function));

        for (let i = 0; i < plots.length; i++)
            this.$graph.$('.plot')!.$$('g')[i].$('path')!.setAttr('class', plots[i].color);
    }

    setCards(cards: Card[]) {
      cards = shuffle(cards);
      
      const $dotGroup = $N('g', {id: '.dots'}, this.$overlay);
      const $cardGroup = $N('g', {id: '.cards'}, this.$overlay);

      let $hoverDot: ElementView|null = null;
      let $dragCard: ElementView|null = null;

      const $cards = cards.map((card, i) => {
        const origin = new Point(this.graphWidth*(i+1/2)/cards.length, -30);
  
        const $outline = $N('circle', {cx: origin.x, cy: origin.y, r: 30, class: 'card-outline'}, $cardGroup);
  
        const $g = $N('g', {transform: `translate(${origin.x}, ${origin.y})`}, $cardGroup) as SVGView;
        
        const $content = $N('g', {class: 'card-content'}, $g);
        const $image = $N('image', {href: '/resources/functions/images/'+card.imagePath, x: -30, y: -30, width: 60, height: 60}, $content);
        const $circle = $N('circle', {cx: 0, cy: 0, r: 30, class: 'card-circle'}, $content);
  
        const dotPosition = this.$graph.toViewportCoords(card.point);
        const $dot = $N('circle', {class: 'dot', transform: `translate(${dotPosition.x}, ${dotPosition.y})`, r: 15}, $dotGroup);
  
        hover($g, {
          enter: () => {
            if (!$dragCard && card.description) {
              this.$descriptionText.text = card.description;
              this.$descriptionText.css('opacity', 1);
              this.$instructionText.css('opacity', 0);
            }
          },
          exit: () => {
            if (!$dragCard && card.description) {
              this.$descriptionText.css('opacity', 0);
              this.$instructionText.css('opacity', 1);
            }
          },
        });
  
        hover($dot, {
          enter: () => {
            $hoverDot = $dot;
  
            if ($dragCard)
              $dragCard.$('.card-content')!.setAttr('transform', `scale(${1/2})`);
          },
          exit: () => {
            $hoverDot = null;
  
            if ($dragCard)
              $dragCard.$('.card-content')!.setAttr('transform', `scale(1)`);
          },
        })
  
        const drag = new Draggable($g, this.$graph.$svg, {useTransform: true, margin: -60});
        
        drag.setPosition(origin.x, origin.y);
  
        drag.on('start', () => {
          $dragCard = $g;
  
          $g.css('pointer-events', 'none');
        })
        drag.on('drag', (p) => {
          
        })
        drag.on('end', () => {
          $dragCard = null;
  
          const dropPosition = drag.position;
          let restPosition: Point;
  
          
          if ($hoverDot == $dot) {
            if (this.$step) {
              this.$step.addHint('correct');
              this.$step.addHint(card.hint);
              this.$step.score('card'+i);
            }
  
            restPosition = dotPosition;
  
            this.$descriptionText.css('opacity', 0);
            this.$instructionText.css('opacity', 1);
          }
          else if ($hoverDot) {
            if (this.$step)
              this.$step.addHint('incorrect');
  
            restPosition = origin;
  
            $content.setAttr('transform', 'scale(1)');
            $g.css('pointer-events', 'all');
          }
          else {
            restPosition = origin;
  
            $g.css('pointer-events', 'all');
          }
  
          animate((p) => {
            const q = ease('sine', p);
            drag.setPosition(lerp(dropPosition.x, restPosition.x, q), lerp(dropPosition.y, restPosition.y, q))
          }, 500)
        })
  
        return $g;
      });
    }
}
