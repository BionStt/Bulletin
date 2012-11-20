from django.shortcuts import render, redirect
from django.http import (
    HttpResponseRedirect,
    HttpResponseBadRequest,
    Http404,
    HttpResponse,
)
from django.contrib.auth.models import User
from django.core.validators import email_re
from django.contrib.auth.decorators import login_required
from django.utils.translation import ugettext, ugettext_lazy as _
from forms import GroupCreationForm
from models import Group, Membership
from posts.forms import PostForm
from posts.models import Post, Comment
from registration.models import EmailInvite
import re
import md5

@login_required
def index(request):
    return render(request, 'inbox.html', {'user': request.user})

@login_required
def group(request, grpid):
    
    # If the user viewing is not a member of this group,
    # tell them it's a 404.
    if not request.user.group_set.filter(id=grpid):
        raise Http404

    if request.method == 'POST':
        form = PostForm(request.POST)
        if form.is_valid():
            post = form.save(commit=False)
            # author = from the current user's set of memberships, the one that
            #          has a group with matching group id (pk)
            post.author = request.user.membership_set.get(group__pk=grpid)
            post.save()
            return HttpResponseRedirect("")
    else:  # not POST, so give a form with some prepopulated stuff
        form = PostForm()

    '''relations are represented by double underscores (i heart django)'''
    post_list = list(Post.objects.filter(author__group__id=grpid))

    # Is the user an admin for this group?
    is_admin = request.user.membership_set.get(group__pk=grpid).is_admin
    return render(request, 'group_view.html', {'post_list': post_list,
                                          'grpid': int(grpid),
                                          'user': request.user,
                                          'form': form,
                                          'is_admin': is_admin})

def _get_extra_emails(request):
    '''
    Gets the extra emails from a request.  This is meant to be used with group
    creation for extracting a list of emails.
    '''
    emails = []
    for name, val in request.POST.iteritems():
        if re.match('^email\d+$', name):
            emails.append(val);
    return emails

def _send_email_invites(request, group):
    '''
    1.) Grab emails
    2.) Remove duplicate emails
    3.) filter invalid emails
    4.) send emails for group invite.
    '''
    emails = _get_extra_emails(request)
    emails = list(set(emails))
    emails = filter(email_re.match, emails)
    EmailInvite.objects.send_confirmation(request.user, emails, group)

def send_invites(request, grpid):
    '''
    Sends an invite to a group of members.
    '''
    if not request.user.is_authenticated():
        raise Http404

    if request.method == 'POST':
        try:
            group = Group.objects.get(pk=grpid)
        except Group.DoesNotExist:
            raise Http404

        try:
            is_admin = group.members.all().get(user=request.user).is_admin
        except Membership.DoesNotExist:
            raise Http404

        if not is_admin:
            raise Http404
        
        _send_email_invites(request, group)
    else:
        raise Http404

@login_required
def create(request):
    '''
    Sets up a group creation form wherein the user may choose the necessary
    criteria for the group they wish to create.

    The user may select the name of the group.
    '''
    if request.method == 'POST':
        form = GroupCreationForm(request.POST)
        if form.is_valid():
            group = form.save()
            
            # Create the default user membership
            m = Membership(user=request.user, group=group, is_admin=True)
            m.save()

            # Send emails to invited members.
            _send_email_invites(request, group)

            ''' Redirect to the new group '''
            return HttpResponse(group.json(), mimetype='application/json')
    else:
        raise Http404
    return render(request, 'group_create_modal.html', {'form': form,})
