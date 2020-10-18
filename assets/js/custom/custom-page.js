class CustomPage {
    constructor() {
        this.init();
    }
    async init() {
        let self = this
        // self.router = new Router();
        // self.setupProgress = await self.router.init();
        self.categories = await getData();
        self.initEvents();
        self.populateData();
        Utilities.hideLoader();
    }
    populateData() {
        let self = this
        let issuesWithCategory = {
            'Categories': self.categories
        };
        $('.issue-settings').append(puglatizer["resourceCollapsible"]["issueSettings"](issuesWithCategory));
    }

    initEvents(){
        // load each topic detais
        $(document).on('click','.issue-btn',async function(){
            let self = $(this);
            let issues_info = self.next().children('.issue-info');
            let topic_id = self.children('.topic').attr('id').substr(2);
            if(! issues_info.hasClass('content-loaded')){
                self.children('.spinner-border').css('display','inline-block');
                await $.ajax({
                    method: 'GET',
                    url: 'http://127.0.0.1:8000/'+topic_id,
                    contentType: 'application/json'
                }).done(function(response){
                    if(response.Example!="-"){
                        response.Example=response.Example.split('\n');
                    }
                    issues_info.append(puglatizer["resourceCollapsible"]["issueInfo"](response));
                    issues_info.addClass('content-loaded');
                    if(self.find('.issue-value-ignored').hasClass('issue-value-ignored')){
                        issues_info.find('.value-ignore').each(function(){
                            $(this).text('ignored');
                            $(this).addClass('value-ignored');
                            $(this).removeClass('value-ignore');
                        })
                    }
                    self.children('.spinner-border').css('display','none');
                }).fail(function(){
                    self.next().removeClass('show');
                });
            }
        });
        // toggle read description about topic
        $(document).on('click','.read-more:contains(More)', function(){
            $(this).text('Read Less');
        });
        $(document).on('click','.read-more:contains(Less)', function(){
            $(this).text('Read More');
        });
        // filter issues base on conditions
        $(document).on('click', '#filter-btn', function(){
            let level = $('#level-select').val();
            let tag = parseInt($('#tag-select').val());
            let is_ignored = $('.checkbox input[name="ShowIgnored"]').prop('checked');
            if(level != ''){
                Utilities.showLoader();
                $.ajax({
                    method:'POST',
                    url: 'http://127.0.0.1:8000/',
                    data: JSON.stringify({'importance': level, 'tag': tag, 'is_ignored': is_ignored}),
                    contentType: 'application/json'
                }).done(function(response){
                    $('.issue-settings').children().remove()
                    let issuesWithCategory = {
                        'Categories': response
                    };
                    $('.issue-settings').append(puglatizer["resourceCollapsible"]["issueSettings"](issuesWithCategory));
                    Utilities.hideLoader();
                }).fail((err)=>{
                    if(err.status == 500){
                        Utilities.hideLoader();
                        Utilities.showAlert(err.responseJSON.error,'danger');
                    }
                    if(err.status == 0){
                        Utilities.hideLoader();
                        Utilities.showAlert('Failed to load filter data','danger');
                    }
                });
            }
        });
        $(document).on('click', '.issue-ignore', (e)=>{
            e.stopImmediatePropagation();
            this.ignore($(e.target));
        });
        $(document).on('click', '.issue-ignored', (e)=>{
            e.stopImmediatePropagation();
            this.ignore($(e.target));
        });
        $(document).on('click', '.value-ignore', (e)=>{
            this.ignore($(e.target));
        });
        $(document).on('click', '.value-ignored', (e)=>{
            this.ignore($(e.target));
        });
        $(document).on('click','.fa-filter',function(){
            $('.filter').toggleClass('filter-show')
        });
    }

    ignore(self){
        let ignore_sibling = self.siblings('.topic');
        let id = ignore_sibling.hasClass('topic') ? ignore_sibling.attr('id').substr(2) : self.parent().parent().attr('class').substr(2);
        let values;
        if(self.parent().hasClass('issue-value')){
            values = self.parent().find('.value-name').text();
        }else{
            values = self.parent().find('.topic').text();
        }
        $.ajax({
            method: 'PUT',
            url:'http://127.0.0.1:8000/'+id,
            data: JSON.stringify(values),
            contentType: 'application/json'
        }).done(function(){
            addIgnoreClasses(self,id,self.text());
        }).fail(function(err){
            console.error(err);
        });
    }
}
function addIgnoreClasses(self, id,present_status){
    let changed_status;
    if(present_status == 'ignore'){
        changed_status = 'ignored'
    }else{
        changed_status = 'ignore'
    }
    self.text(changed_status);
    if(self.parent().hasClass('issue-btn')){
        self.addClass('issue-'+changed_status);
        self.removeClass('issue-'+present_status);
        self.parent().next('.issue-body').toggleClass('issue-body-ignored');
        self.parent().toggleClass('issue-topic-ignored');
        if(self.parent().next().hasClass('issue-body-ignored')){
            self.parent().next().find('.issue-value').children('span').addClass('pointer-events-none');
        }else{
            self.parent().next().find('.issue-value').children('span').removeClass('pointer-events-none');
        }
    }else{
        self.addClass('value-'+changed_status);
        self.removeClass('value-'+present_status);
        self.parent().toggleClass('issue-value-ignored');
    }
    self.parent().next('.issue-body').find('.value-'+present_status).addClass('value-'+changed_status);
    self.parent().next('.issue-body').find('.value-'+present_status).removeClass('value-'+present_status);
}
$(function onDocReady() {
    let customPage = new CustomPage();
});