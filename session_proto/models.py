from django.db import models
from django import forms

class User(models.Model):
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=32)  # md5 hash
    date_joined = models.DateTimeField(auto_now_add=True)
    
    def __unicode__(self):
        return self.last_name + ", " + self.first_name + " | " + self.email
    
    class Meta:
        ordering = ['last_name', 'first_name', 'email']

class Session(models.Model):
    user = models.ForeignKey(User)
    token = models.CharField(max_length=32)  # 32 char tokens
    ip = models.IPAddressField()  # used for verification
    time_created = models.DateTimeField(auto_now_add=True)
    
    def __unicode__(self):
        return self.user.email + " | " + self.token
    
    class Meta:
        ordering = ['time_created']

class RegisterForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email', 'password')

class LoginForm(forms.Form):
    email = forms.CharField(label='Email')
    password = forms.CharField(label='Password')
    #class Meta:
    #    model = User
    #    fields = ('email', 'password')

