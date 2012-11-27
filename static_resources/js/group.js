/* Automatically makes an ajax call to 'update/' view
 * times out after 40s
 * after timeout or sucess, recursively calls itself again
 *
 * based on example from
 * http://techoctave.com/c7/posts/60-simple-long-polling-example-with-javascript-and-jquery
 */
function update() {
    $.ajax({url: "update/", success: function(data) {
    	if ($(data).hasClass("comment")) {
            // returned data is a comment
            var postID = "#post-" + $(data).attr("post");
            var newComment = $(data)
            $(newComment).hide();
            $(newComment).find(".avatar").show();
            $(newComment).find(".timeago").timeago().show();
            $(postID).find(".comments").append(newComment);
            $(newComment).fadeIn();
            var parentPost = $(newComment).parents(".post");
            var postAvatar = $(parentPost).children(".avatar-container").find(".avatar");
            var postHeight = parentPost.height();
            animateResize(postAvatar, postHeight);
        } else if ($(data).hasClass("post")) {
            // returned data is a post
            var newPost = $(data);
            $(newPost).hide();
            $(newPost).find(".avatar").show();
            $(newPost).find(".timeago").timeago().show();
            $("#posts").prepend(newPost);
            $(newPost).fadeIn();
            initCommentSlider();
            initCommentAjax();
        }
    }, dataType: "html", complete: update, timeout: 25000});
}

function initCommentSlider() {
    $('.comment-unhide-btn').click(function(event) {
    	var $commentForm;
        var $post;

        event.preventDefault();
        $post = $(this).parents('.post');
        $commentForm = $post.find(".comment-form-container");
        $(this).parent().fadeOut();
        $commentForm.show("blind", function() {
			var scroll = $post.offset().top - $('.navbar').height();
			if (scroll + $(window).height() < $commentForm.offset().top + $commentForm.height()) {
				scroll += $commentForm.offset().top + $commentForm.height() - (scroll + $(window).height());
			}
            $('html, body').animate({
                scrollTop: scroll
            }, 500);
			$($commentForm).find('input[type="text"]').focus();
			var postHeight = $($post).height();
        
			$($post).children('.avatar-container').each(function() { // Avatars within posts
				$(this).find('.avatar').each(function() {
					animateResize(this, postHeight);
				});
			});
        });
    });
}

function initCommentAjax() {
	$('.comment-form').submit(function(event) {
        event.preventDefault();

        var form = $(this);
        var url = '/post/' + form.find('input[name="id_post"]').val() + '/comment/';
        var msg = form.find('#id_message').val();
        var csrf = form.find('input[name="csrfmiddlewaretoken"]').val();

        $.post(url, {message: msg, csrfmiddlewaretoken: csrf}, function(data) {
            // copy of message is returned via html, insert into page
            /* comment_html = data;
             * form.parent().siblings('.comments').append($(comment_html));
             */
            form.find("#id_message").val("");
            
            /* $('.comment.new').each(function() { 
             *     var postHeight = $(this).height();
             *     
             *     $(this).children('.avatar-container').each(function() { // Avatars within posts
             *         $(this).find('.avatar').each(function() {
             *             resizeAvatar(this, postHeight);
             *         });
             *     });
             * });
             */
			/* $post = $(form).parents('.post');
			 * var postHeight = $($post).height();
			 * $($post).children('.avatar-container').each(function() { // Avatars within posts
			 * 	$(this).find('.avatar').each(function() {
			 * 		animateResize(this, postHeight);
			 * 	});
			 * });
			 */
			$commentForm = $(form).parents('.comment-form-container');
			var scroll = window.pageYOffset - $('.navbar').height();
			if (scroll + $(window).height() < $commentForm.offset().top + $commentForm.height()) {
				scroll += $commentForm.offset().top + $commentForm.height() - (scroll + $(window).height());
				$('html, body').animate({
					scrollTop: scroll
				}, 500, function() {
					$($commentForm).find('input[type="text"]').focus();
				});
			} else {
				$($commentForm).find('input[type="text"]').focus();
			}
            
            /* $('.timeago.new').timeago().fadeIn();
             */
        }, 'html');
    });
}

function initPostAjax() {
	$("#post_form").submit(function(event) {
		event.preventDefault();

		var form = $(this);
		var url = 'post/';
		var msg = form.find("#id_message").val();
		var csrf = form.find('input[name="csrfmiddlewaretoken"]').val();

		$.post(url, {message: msg, csrfmiddlewaretoken: csrf}, function(data) {
			form.find("#id_message").val("");
		}, "html");
	});
}

var timer = setInterval(recomputeTimeAgo, 60000);

function recomputeTimeAgo () {
	$('.timeago.new').timeago();
}

function initDynamicAvatarSize() {
	$('.post').each(function() { 
        var postHeight = $(this).height();
        
        $(this).children('.avatar-container').each(function() { // Avatars within posts
            $(this).find('.avatar').each(function() {
                resizeAvatar(this, postHeight);
            });
        });
        
        $(this).find('.comment').each(function() { // Avatars within comments
            var commentHeight = $(this).height();
            $(this).find('.avatar').each(function() {
                resizeAvatar(this, commentHeight);
            });
        });
    });
}

function resizeAvatar (avatar, parentHeight) {	
	$("<img/>")
		.attr("src", $(avatar).attr("src"))
		.load(function() {
			var scale = this.width/this.height;
			var computedHeight = Math.max(Math.min(this.height, parentHeight), 60);
			$(avatar).css('height',  computedHeight + 'px');
			$(avatar).css('min-width',  computedHeight*scale + 'px');
			$(avatar).css('margin-left',  -(computedHeight*scale - 60 )/3 + 'px');
			$(avatar).fadeIn();
    });
}

function animateResize (avatar, parentHeight) {	
	$("<img/>")
		.attr("src", $(avatar).attr("src"))
		.load(function() {
			var scale = this.width/this.height;
			var computedHeight = Math.max(Math.min(this.height, parentHeight), 60);
			$(avatar).animate({"margin-left": -(computedHeight*scale - 60 )/3 + 'px',
							   "min-width": computedHeight*scale + 'px',
							   "height": computedHeight + 'px'}, 400);
    });
}

$(document).ready(function() {
	$('abbr.timeago').timeago().fadeIn();
    initCommentSlider();
    initCommentAjax();
    initPostAjax();
    update();
});

$(window).load(function() {
    initDynamicAvatarSize();
	$('.avatar').fadeIn();
});
