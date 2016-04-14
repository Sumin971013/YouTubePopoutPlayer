// ==UserScript==
// @name        YouTube Popout Player
// @author      Ryan Thaut
// @description
// @namespace   http://repo.ryanthaut.com/userscripts/youtube_popout_player
// @updateURL   http://repo.ryanthaut.com/userscripts/youtube_popout_player/youtube_popout_player.meta.js
// @downloadURL http://repo.ryanthaut.com/userscripts/youtube_popout_player/youtube_popout_player.user.js
// @include     *//www.youtube.com/*
// @version     1.1.0.0
// @grant       none
// ==/UserScript==

'use strict';

const DEBUG = false;

var YouTubePopoutPlayer =
{
    defaults: {
        width: 854,
        height: 480,
        startThreshold: 5
    },

    getVideoID: function() {
        var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
        var match = window.location.href.match(regExp);
        return (match && match[7].length == 11) ? match[7] : null;
    },

    insertControls: function()
    {
        if (DEBUG) console.group('YouTubePopoutPlayer.insertControls()');

        var btn = document.getElementById('popout-player-button');
        if (btn)
        {
            if (DEBUG) console.warn('#popout-player-button already exists', btn);
            return false;
        }

        var target = document.getElementById('watch7-action-buttons') ||
                     document.getElementById('watch8-secondary-actions');
        if (!target)
        {
            if (DEBUG) console.warn('Missing #watch7-action-buttons & #watch8-secondary-actions');
            return false;
        }
        else
        {
            if (DEBUG) console.log('Found #' + target.id, target);
        }

        var lbl = document.createElement('span');
        lbl.className = 'yt-uix-button-content';
        lbl.innerHTML = 'Popout';

        btn = document.createElement('button');
        btn.id = 'popout-player-button';
        btn.className = 'yt-uix-button yt-uix-button-size-default yt-uix-button-opacity yt-uix-button-has-icon no-icon-markup pause-resume-autoplay yt-uix-tooltip yt-uix-button-toggled';
        btn.appendChild(lbl);
        btn.addEventListener('click', this.onClick, false);

        target.appendChild(btn);
        if (DEBUG) console.log('Inserted <button>', btn);

        if (DEBUG) console.groupEnd();
    },

    insertCSS: function()
    {
        if (DEBUG) console.group('YouTubePopoutPlayer.insertCSS()');

        var css = '';
        css += '#popout-player-button::before { background: no-repeat url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAWUlEQVQ4jb3R2w0AIAgDQDZndF0AaIEqCV+G46HZj3D3000pVqKwI1ODuqGp/oHMylJQOmGFtMHotmMQfVQLzLDsHDRYYe2VmaDASaYdVphszehxPdkzUBkX7OD4ZHHL5rYAAAAASUVORK5CYII=); background-size: auto; width: 20px; height: 20px }';

        if (DEBUG) console.log('css', css);

        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = css;

        document.body.appendChild(style);
        if (DEBUG) console.log('Inserted <style>', style);

        if (DEBUG) console.groupEnd();
    },

    onClick: function(e)
    {
        if (DEBUG) console.group('YouTubePopoutPlayer.onClick()');

        var id, width, height, time;

        var player = new HTML5Player();

        if (player.initialize())
        {
            if (DEBUG) console.log('HTML5 Player initialized');

            player.pause();

            id = player.getVideoID();
            width = player.getWidth();
            height = player.getHeight();
            time = player.getTime();

            //player.remove();
        }
        else
        {
            if (DEBUG) console.log('Missing HTML5 Player');

            id = YouTubePopoutPlayer.getVideoID();
            width = YouTubePopoutPlayer.defaults.width;
            height = YouTubePopoutPlayer.defaults.height;
            time = 0;
        }

        if (time <= YouTubePopoutPlayer.defaults.startThreshold)
        {
            if (DEBUG) console.info('Popout video will start from beginning');
            time = 0;
        }

        YouTubePopoutPlayer.popoutPlayer(id, width, height, time);

        if (DEBUG) console.groupEnd();
    },

    popoutPlayer: function(id, width, height, time)
    {
        if (DEBUG) console.group('YouTubePopoutPlayer.popoutPlayer()');

        if (DEBUG) console.log('id', id);
        if (DEBUG) console.log('width', width);
        if (DEBUG) console.log('height', height);
        if (DEBUG) console.log('time', time);

        var location = 'https://www.youtube.com/embed/' + id + '?autoplay=1&start=' + time;
        var options = 'width=' + width + ',height=' + height + ',scrollbars=no,toolbar=no';

        if (DEBUG) console.log('location', location);
        if (DEBUG) console.log('options', options);

        var popout = window.open(location, id, options);
        if (DEBUG) console.log('Opened window', popout);

        if (DEBUG) console.groupEnd();
    },

    watchPageChange: function()
    {
        if (DEBUG) console.group('YouTubePopoutPlayer.watchPageChange()');

        var self = this;

        var content = document.getElementById('content');
        if (!content)
        {
            if (DEBUG) console.warn('Missing #content');
            return false;
        }

        var observer = new MutationObserver(function(mutations)
        {
            mutations.forEach(function(mutation)
            {
                if (mutation.addedNodes !== null)
                {
                    for (var i = 0; i < mutation.addedNodes.length; i++)
                    {
                        if (mutation.addedNodes[i].id == 'watch7-container' ||
                            mutation.addedNodes[i].id == 'watch7-main-container')
                        {
                            if (DEBUG) console.log('Mutation observed for #' + mutation.addedNodes[i].id, mutation);
                            self.insertControls();
                            break;
                        }
                    }
                }
            });
        });
        observer.observe(content, {childList: true, subtree: true});

        if (DEBUG) console.groupEnd();
    },

    initialize: function()
    {
        if (DEBUG) console.group('YouTubePopoutPlayer.initialize()');

        this.insertCSS();
        this.insertControls();
        this.watchPageChange();

        if (DEBUG) console.groupEnd();
    }
};

var HTML5Player = function()
{
    this.container = null;
    this.player = null;
    this.config = null;
};
HTML5Player.prototype = {
    constructor: HTML5Player,

    pause: function()
    {
        if (DEBUG) console.group('HTML5Player.pause()');

        if (this.player)
        {
            if (DEBUG) console.log('Pausing video player', this.player);
            this.player.pauseVideo();
        }

        if (DEBUG) console.groupEnd();
    },

    remove: function()
    {
        if (DEBUG) console.log('HTML5Player.remove()');

        if (this.container)
        {
            if (DEBUG) console.log('Removing container element', this.container);
            this.container.remove();
        }

        if (DEBUG) console.groupEnd();
    },

    getVideoID: function()
    {
        if (DEBUG) console.log('HTML5Player.getVideoID()');

        return this.config ? this.config.args.video_id : null;
    },

    getWidth: function()
    {
        if (DEBUG) console.log('HTML5Player.getWidth()');

        return this.player ? this.player.clientWidth : 0;
    },

    getHeight: function()
    {
        if (DEBUG) console.log('HTML5Player.getHeight()');

        return this.player ? this.player.clientHeight : 0;
    },

    getTime: function()
    {
        if (DEBUG) console.log('HTML5Player.getTime()');

        return this.player ? parseInt(this.player.currentTime, 10) : 0;
    },

    initialize: function()
    {
        if (DEBUG) console.group('HTML5Player.initialize()');

        var success = true;

        // find the video player's container and store a reference to it
        this.container = document.getElementById('movie_player');
        if (this.container)
        {
            if (DEBUG) console.log('Found #movie_player', this.container);
            success &= true;
        }
        else
        {
            success &= false;
        }

        // find the video player and store a reference to it
        if (this.container)
        {
            this.player = this.container.getElementsByTagName('video')[0];
            if (this.player)
            {
                if (DEBUG) console.log('Found <video>', this.player);
                success &= true;
            }
            else
            {
                success &= false;
            }
        }

        // pull the config object
        if (window.ytplayer && window.ytplayer.config)
        {
            if (DEBUG) console.log('Found window.ytplayer.config object', window.ytplayer.config);
            this.config = window.ytplayer.config;
            success &= true;
        }
        else
        {
            if (DEBUG) console.log('Missing window.ytplayer.config object');
            success &= false;
        }

        if (DEBUG) console.log(success ? 'Successful' : 'Unsuccessful');
        if (DEBUG) console.groupEnd();

        return success;
    }
};

(function() {
    if (DEBUG) console.log('(function() { ... })()');
    YouTubePopoutPlayer.initialize();
})();
