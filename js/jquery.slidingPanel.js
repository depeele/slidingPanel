/** @file
 *
 *  A sliding tab panel that docks to the edge of the container and slides out
 *  when activated.
 *
 *  Required general layout:
 *      <div id='panel1'>
 *       <ul class='tabs'>
 *        <li class='tab'>
 *         <header class='tab-label'><h1>Tab Label</h1></header>
 *         <div    class='tab-content'></div>
 *        </li>
 *        ...
 *       </ul>
 *      </div>
 *
 *  Instantiation:
 *      $('#panel1').slidingPanel();
 */
(function($) {

$.fn.slidingPanel = function(options) {
    this.each(function(){
        var $el     = $(this);

        $el.data('slidingPanel', new SlidingPanel($el, options || {}) );
    });

    return this;
};

/** @brief  The SlidingPanel widget.
 *  @param  $el     The source DOM element;
 *  @param  options Initialization options 9see SlidingPanel.init());
 */
function SlidingPanel($el, options)
{
    return this.init($el, options);
}
SlidingPanel.defaults = {
    position:   'top',
    state:      'closed',   // Initial/current state
    margin:     '0.5em',
    animation:  {
        open:   200,
        close:  100
    }
};

$.extend(SlidingPanel.prototype, {
    /** @brief  Initialize this instance.
     *  @param  $el         The source DOM element;
     *  @param  options     Initialization options
     *                          position    The attachment position
     *                                        [ 'top' ], 'right',
     *                                        'bottom', 'left'
     *                          margin      The margins to include on either
     *                                      end of the tab bar
     *                                        [ 0.5em ];
     *                          state       The initial state
     *                                        [ 'opened' ], 'closed'
     *
     *  Triggers events:
     *      opened      on $el when the panel is opened;
     *      closed      on $el when the panel is closed;
     *      selected    on the target tab when a tab is selected;
     */
    init: function($el, options) {
        var self            = this;

        // Assemble our options
        self.options        = $.extend({}, SlidingPanel.defaults, options);

        // Gather and create the pieces of this widget
        self.$el            = $el;
        self.$tabs          = self.$el.find('.tabs > .tab');
        self.$labels        = self.$tabs.find('.tab-label');
        self.$contents      = self.$tabs.find('.tab-content');

        if ((self.$labels.length < 1) || (self.$contents.length < 1))
        {
            /* There were no '.tab-label' and/or '.tab-content' items.
             * For labels,   use the first child of each tab,
             * for contents, use the last  child of each tab.
             */
            var needLabels      = self.$labels.length < 1,
                needContents    = self.$contents.length < 1;

            self.$tabs.each(function() {
                var $children   = $(this).children();

                if (needLabels)     { self.$labels.add( $children.first() ); }
                if (needContents)   { self.$contents.add( $children.last() ); }
            });
        }

        // Wrap the content items so we can provide a "margin" for the content
        self.$contents.wrap('<div class="tab-content-wrapper" />');

        self.$wrapper       = self.$tabs.find('.tab-content-wrapper');

        self.$el.addClass('sliding-panel');

        switch (self.options.position)
        {
        case 'top':
        case 'bottom':
            self.$el.addClass('panel-horizontal');
            self.orientation = 'horizontal';

            self.dimension   = 'height';
            if (self.options.margin)
            {
                var css = {
                        'padding-left':     self.options.margin,
                        'padding-right':    self.options.margin
                    };

                self.$el.css( css );
                self.$wrapper.css( css );
            }
            break;

        case 'left':
        case 'right':
            self.orientation = 'vertical';
            self.dimension   = 'width';

            self.$el.addClass('panel-vertical');
            if (self.options.margin)
            {
                var css = {
                        'padding-top':      self.options.margin,
                        'padding-bottom':   self.options.margin
                    };

                self.$el.css( css );
                self.$wrapper.css( css );
            }
            break;
        }
        self.$el.addClass('panel-'+ self.options.position);

        /* Compute an initial valud for the opened/closed dimensions of the
         * panel (used to animate open/close).
         */
        self.sizeClosed = self.$el[ self.dimension ]();
        self.sizeOpened = self.sizeClosed + self.$contents[ self.dimension ]();

        // Initialize event handlers
        _attachHandlers.call(self);

        self.toggle( self.options.state );

        return self;
    },

    /** @brief  Remove any modifications we've made.
     */
    remove: function() {
        var self    = this;

        _detachHandlers.call(self);

        self.$contents.unwrap();

        self.$el.removeClass(  'sliding-panel '
                             + 'panel-'+ self.orientation +' '
                             + 'panel-'+ self.options.position +' '
                             + 'opened')
                .removeAttr('style');

        self.$tabs.removeClass('tab-selected');

        return self;
    },

    /** @brief  Toggle the panel opened/closed.
     *  @param  state   If provided, the new state ('opened', 'closed'),
     *                  otherwise, toggle.
     *  @param  snap    If true, do NOT perform animation [ false ];
     *
     */
    toggle: function(state, snap) {
        var self    = this,
            css     = {};

        state = state || (self.$el.hasClass('opened') ? 'closed' : 'opened');
        snap  = (snap === true) || (self.options.animation[ state ] < 1);

        switch (state)
        {
        case 'opened':
            if (! self.$el.hasClass('opened'))
            {
                // Currently closed -- open
                if (snap === true)
                {
                    self.$el.addClass('opened')
                            .trigger('opened');
                    self.options.state = 'opened';
                }
                else
                {
                    // Animate the transition
                    css[ self.dimension ] = self.sizeOpened;

                    self.$el.animate(css, self.options.animation.open,
                                     function() {
                                        self.$el.addClass('opened')
                                                .trigger('opened');
                                        self.$el.css(self.dimension, '');
                                        self.options.state = 'opened';
                                     });
                }
            }
            break;

        case 'closed':
            if (self.$el.hasClass('opened'))
            {
                // Currently opened -- close
                if (snap === true)
                {
                    self.$el.removeClass('opened')
                            .trigger('closed');
                    self.options.state = 'closed';
                }
                else
                {
                    // Animate the transition
                    css[ self.dimension ] = self.sizeClosed;

                    self.$el.animate(css, self.options.animation.open,
                                     function() {
                                        self.$el.removeClass('opened')
                                                .trigger('closed');
                                        self.$el.css(self.dimension, '');
                                        self.options.state = 'closed';
                                     });
                }
            }
            break;
        }

        return self;
    },

    /** @brief  Select the identified tab.
     *  @param  idex    The tab index.
     */
    select: function(idex) {
        var self    = this;

        self.$tabs.removeClass('tab-selected')
                  .eq(idex)
                    .addClass('tab-selected')
                    .trigger('selected');

        return self;
    }
});

/*****************************************************************************
 * Private helpers
 *
 */

/** @brief  Initialize the event handlers.
 *
 *  'this' is the calling SlidingPanel instance.
 */
function _attachHandlers()
{
    var self    = this;

    self.$labels.on('click.slidingPanel', function(e){
        var $tab    = $(this).parent();

        if ($tab.hasClass('tab-selected'))
        {
            self.toggle();
        }
        else
        {
            self.select( self.$tabs.index( $tab ) );
            self.toggle('opened');
        }
    });

    return self;
}

/** @brief  Detach all event handlers.
 *
 *  'this' is the calling SlidingPanel instance.
 */
function _detachHandlers()
{
    var self    = this;

    self.$labels.off('.slidingPanel');

    return self;
}


}(jQuery));
